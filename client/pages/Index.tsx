import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecorderPanel } from "@/components/RecorderPanel";
import { OutputTabs } from "@/components/OutputTabs";
import { UploadSources } from "@/components/UploadSources";
import { HeroShowcase } from "@/components/HeroShowcase";

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const studioRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {}, []);

  const wordCount = useMemo(() => (transcript.trim() ? transcript.trim().split(/\s+/).length : 0), [transcript]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)] bg-custom-radial" />
        <div className="container py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4">New • AI study workspace</Badge>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">EchoNotes</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-prose">
                Record or import lectures and get beautiful notes, quizzes and flashcards in seconds. Works in your browser with optional cloud transcription for long videos.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#studio"><Button className="px-6">Open Studio</Button></a>
                <a href="#how"><Button variant="outline">How it works</Button></a>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-green-500"/> Live STT</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500"/> Browser‑first</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500"/> Import videos</span>
              </div>
            </div>
            <div>
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-10 sm:py-14">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm font-medium">1. Import</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload audio/video or paste a YouTube link.</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium">2. Transcribe</p>
            <p className="mt-1 text-sm text-muted-foreground">Use live STT or background ML providers.</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium">3. Study</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate notes, quizzes and flashcards instantly.</p>
          </Card>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" ref={studioRef} className="container py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <UploadSources onTranscript={setTranscript} />
            <RecorderPanel value={transcript} onChange={setTranscript} />
          </div>
          <div className="space-y-4 lg:sticky lg:top-16">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Study materials</h3>
                <span className="text-sm text-muted-foreground">{wordCount} words</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Turn your transcript into structured content.</p>
              <div className="mt-4">
                <OutputTabs transcript={transcript} />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <h3 className="font-semibold">Highlights</h3>
              <ul className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                <li className="rounded-lg border p-3">Fast, privacy‑first workflow</li>
                <li className="rounded-lg border p-3">Import long videos in background</li>
                <li className="rounded-lg border p-3">Clean, editable transcript</li>
                <li className="rounded-lg border p-3">Exportable notes & cards</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
