import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";

interface RecorderPanelProps {
  value: string;
  onChange: (v: string) => void;
}

export function RecorderPanel({ value, onChange }: RecorderPanelProps) {
  const { isSupported, status, transcript, error, start, stop, reset } = useSpeechToText();

  useEffect(() => {
    if (transcript) onChange(transcript);
  }, [transcript, onChange]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn("rounded-full px-3 py-1 text-xs", status === "recording" ? "bg-green-600" : "bg-muted text-muted-foreground")}>{status === "recording" ? "Recording" : "Idle"}</Badge>
          {!isSupported && <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs">Live STT unsupported</Badge>}
        </div>
        <div className="flex gap-2">
          {status !== "recording" ? (
            <Button onClick={start} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm7-3a1 1 0 1 0-2 0a5 5 0 0 1-10 0a1 1 0 1 0-2 0a7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z"/></svg>
              Start
            </Button>
          ) : (
            <Button variant="secondary" onClick={stop}>Stop</Button>
          )}
          <Button variant="ghost" onClick={() => { reset(); onChange(""); }}>Clear</Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Transcript</label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Live transcription will appear here. You can also paste lecture text manually."
          className="min-h-[200px] resize-y"
        />
        <p className="mt-2 text-xs text-muted-foreground">Tip: Keep the tab focused for best accuracy while recording. You can freely edit the transcript.</p>
      </div>
    </div>
  );
}
