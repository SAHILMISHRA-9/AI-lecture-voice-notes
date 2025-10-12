import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HeroShowcase() {
  return (
    <Card className="p-6 sm:p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span className="font-medium">Transcribing: lecture.mp4</span>
        </div>
        <span className="text-xs text-muted-foreground">00:42</span>
      </div>
      <Progress value={72} />
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="mt-3 h-28 rounded-xl bg-gradient-to-br from-primary/15 to-indigo-500/15" />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">Notes</p>
            <div className="mt-2 h-10 rounded bg-muted" />
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">Quiz</p>
            <div className="mt-2 h-10 rounded bg-muted" />
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">Flashcards</p>
            <div className="mt-2 h-10 rounded bg-muted" />
          </div>
        </div>
      </div>
    </Card>
  );
}
