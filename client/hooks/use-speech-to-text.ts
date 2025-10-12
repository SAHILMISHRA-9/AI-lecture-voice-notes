import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "recording" | "stopping";

interface UseSpeechToText {
  isSupported: boolean;
  status: SpeechStatus;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechToText(): UseSpeechToText {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const finalBufferRef = useRef<string>("");

  const isSupported = typeof window !== "undefined" && (
    // @ts-expect-error webkit types not in lib.dom
    !!window.SpeechRecognition || !!window.webkitSpeechRecognition
  );

  useEffect(() => {
    if (!isSupported) return;
    // @ts-expect-error webkit types not in lib.dom
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = String(res[0].transcript || "").trim();
        if (!text) continue;
        if (res.isFinal) {
          finalBufferRef.current += (finalBufferRef.current ? "\n" : "") + text;
          interim = "";
        } else {
          interim = text;
        }
      }
      const combined = finalBufferRef.current + (interim ? " " + interim : "");
      setTranscript(combined);
    };

    recognition.onerror = (e: any) => {
      setError(e?.error || "Speech recognition error");
      setStatus("idle");
    };

    recognition.onend = () => {
      setStatus("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setError(null);
    setStatus("recording");
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Some browsers throw if already started; try restarting
      try {
        recognitionRef.current.stop();
        recognitionRef.current.start();
      } catch (err) {
        setError("Unable to start speech recognition");
        setStatus("idle");
      }
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setStatus("stopping");
    try { recognitionRef.current.stop(); } catch {}
  }, [isSupported]);

  const reset = useCallback(() => {
    setTranscript("");
    finalBufferRef.current = "";
    setError(null);
  }, []);

  return { isSupported, status, transcript, error, start, stop, reset };
}
