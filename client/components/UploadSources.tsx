import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { normalizeTranscript } from "@/lib/ai";

export function UploadSources({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [yt, setYt] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setProgress(10);
    setError(null);

    try {
      const base64 = await file.arrayBuffer().then(buf => Buffer.from(buf).toString("base64"));

      const res = await fetch("/api/transcribe-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64 }),
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onTranscript(normalizeTranscript(data.text || ""));
      setProgress(100);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
      e.currentTarget.value = "";
    }
  };

  const onYouTube = async () => {
    if (!yt.trim()) return;
    setBusy(true);
    setProgress(20);
    setError(null);

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
    } catch (err: any) {
      setError(err?.message || "YouTube transcription failed");
    } finally {
      setBusy(false);
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
        <div>
          <label>Upload file</label>
          <Input type="file" accept="video/*,audio/*" onChange={onPick} disabled={busy} />
        </div>
        <div>
          <label>YouTube link</label>
          <div className="flex gap-2">
            <Input type="url" value={yt} onChange={e => setYt(e.target.value)} disabled={busy} />
            <Button onClick={onYouTube} disabled={busy || !yt.trim()}>Import</Button>
          </div>
        </div>
      </div>
      {busy && <Progress value={progress} />}
      {error && <p className="text-red-500">{error}</p>}
    </Card>
  );
}
