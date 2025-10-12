import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTranscriptionStatus, startTranscriptionFile, startTranscriptionYouTube, transcribeFile, transcribeYouTube } from "@/lib/api";
import { normalizeTranscript } from "@/lib/ai";

interface UploadSourcesProps {
  onTranscript: (t: string) => void;
}

export function UploadSources({ onTranscript }: UploadSourcesProps) {
  const [busy, setBusy] = useState(false);
  const [yt, setYt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<string | null>(null);
  const stopRef = useRef(false);

  useEffect(() => { return () => { stopRef.current = true; }; }, []);

  async function pollJob(id: string) {
    setPhase("Transcribing");
    setProgress((p) => (p < 35 ? 35 : p));
    let tick = 40;
    while (!stopRef.current) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const s = await getTranscriptionStatus(id);
        if (s.status === "completed") {
          setProgress(100);
          setPhase(null);
          return s.text || "";
        }
        if (s.status === "error") {
          throw new Error(s.error || "Transcription error");
        }
        tick = Math.min(95, tick + 5);
        setProgress(tick);
      } catch (e: any) {
        throw e;
      }
    }
    throw new Error("Cancelled");
  }

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setError(null); setProgress(10); setPhase("Uploading"); stopRef.current = false;
    try {
      let id = "";
      try {
        id = await startTranscriptionFile(f);
      } catch (err: any) {
        // Fallback to synchronous for OpenAI when AssemblyAI not configured
        if (String(err?.message || "").includes("ASSEMBLYAI_API_KEY")) {
          const text = await transcribeFile(f);
          onTranscript(normalizeTranscript(text));
          return;
        }
        throw err;
      }
      setProgress(30);
      const text = await pollJob(id);
      onTranscript(normalizeTranscript(text));
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("No transcription provider configured") || msg.includes("OPENAI_API_KEY") || msg.includes("ASSEMBLYAI_API_KEY")) {
        setError("Upload requires ASSEMBLYAI_API_KEY or OPENAI_API_KEY on the server.");
      } else {
        setError(msg || "Upload failed");
      }
    } finally { setBusy(false); e.currentTarget.value = ""; setPhase(null); setProgress(0); }
  };

  const onYouTube = async () => {
    if (!yt.trim()) return;
    setBusy(true); setError(null); setProgress(20); setPhase("Starting job"); stopRef.current = false;
    try {
      let id = "";
      try {
        id = await startTranscriptionYouTube(yt.trim());
      } catch (err: any) {
        const text = await transcribeYouTube(yt.trim());
        onTranscript(normalizeTranscript(text));
        return;
      }
      setProgress(35);
      const text = await pollJob(id);
      onTranscript(normalizeTranscript(text));
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("ASSEMBLYAI_API_KEY")) {
        setError("YouTube import requires ASSEMBLYAI_API_KEY on the server.");
      } else {
        setError(msg || "YouTube transcription failed");
      }
    } finally { setBusy(false); setPhase(null); setProgress(0); }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Import a lecture</h3>
        <p className="text-sm text-muted-foreground">Upload a video/audio file or paste a YouTube link to auto‑transcribe.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onPick({ target: { files: [f] } } as any as React.ChangeEvent<HTMLInputElement>);
          }}
          className="rounded-lg border border-dashed p-3">
          <label className="block text-sm font-medium mb-1">Upload file</label>
          <Input type="file" accept="video/*,audio/*" onChange={onPick} disabled={busy} />
          <p className="mt-2 text-xs text-muted-foreground">Drag & drop a file here</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">YouTube link</label>
          <div className="flex gap-2">
            <Input type="url" aria-label="YouTube URL" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/watch?v=..." disabled={busy} className="flex-1" />
            <Button onClick={onYouTube} disabled={busy || !yt.trim()}>Import</Button>
          </div>
        </div>
      </div>
      {busy && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{phase ? `${phase}…` : "Processing…"}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">This runs in the background and can take a few minutes for long videos.</p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">YouTube import requires ASSEMBLYAI_API_KEY configured on the server.</p>
    </Card>
  );
}
