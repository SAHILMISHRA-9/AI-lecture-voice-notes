import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  useEffect(() => {
    return () => { stopRef.current = true; };
  }, []);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setProgress(10);
    setPhase("Uploading");
    stopRef.current = false;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Vercel API
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      onTranscript(normalizeTranscript(data.text || ""));
      setProgress(100);
      setPhase(null);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
      setPhase(null);
      setProgress(0);
    }
  };

  const onYouTube = async () => {
    if (!yt.trim()) return;
    setBusy(true);
    setError(null);
    setProgress(20);
    setPhase("Fetching YouTube transcript");

    try {
      const res = await fetch("/api/transcribe-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: yt.trim() }),
      });

      if (!res.ok) throw new Error("YouTube transcription failed");
      const data = await res.json();

      onTranscript(normalizeTranscript(data.text || ""));
      setProgress(100);
      setPhase(null);
    } catch (err: any) {
      setError(err?.message || "YouTube transcription failed");
    } finally {
      setBusy(false);
      setPhase(null);
      setProgress(0);
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Import a lecture</h3>
        <p className="text-sm text-muted-foreground">Upload a video/audio file or paste a YouTube link to auto‑transcribe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onPick({ target: { files: [f] } } as any as React.ChangeEvent<HTMLInputElement>);
          }}
          className="rounded-lg border border-dashed p-3"
        >
          <label className="block text-sm font-medium mb-1">Upload file</label>
          <Input type="file" accept="video/*,audio/*" onChange={onPick} disabled={busy} />
          <p className="mt-2 text-xs text-muted-foreground">Drag & drop a file here</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">YouTube link</label>
          <div className="flex gap-2">
            <Input
              type="url"
              aria-label="YouTube URL"
              value={yt}
              onChange={(e) => setYt(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={busy}
              className="flex-1"
            />
            <Button onClick={onYouTube} disabled={busy || !yt.trim()}>
              Import
            </Button>
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
    </Card>
  );
}
