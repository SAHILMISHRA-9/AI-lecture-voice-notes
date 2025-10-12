import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { generateFlashcards, generateNotes, generateQuiz } from "@/lib/ai";

interface OutputTabsProps {
  transcript: string;
}

export function OutputTabs({ transcript }: OutputTabsProps) {
  const [reveal, setReveal] = useState(false);
  const notes = useMemo(() => generateNotes(transcript), [transcript]);
  const quiz = useMemo(() => generateQuiz(transcript), [transcript]);
  const cards = useMemo(() => generateFlashcards(transcript), [transcript]);

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="mb-3">
        <TabsTrigger value="notes">Study Notes</TabsTrigger>
        <TabsTrigger value="quiz">Quizzes</TabsTrigger>
        <TabsTrigger value="flash">Flashcards</TabsTrigger>
      </TabsList>
      <TabsContent value="notes">
        <Card className="p-5 space-y-3">
          {notes.length === 0 ? (
            <p className="text-muted-foreground">Provide a transcript to generate notes.</p>
          ) : (
            <ul className="list-disc pl-6 space-y-2">
              {notes.map((n, i) => (
                <li key={i} className="leading-relaxed">{n}</li>
              ))}
            </ul>
          )}
        </Card>
      </TabsContent>
      <TabsContent value="quiz">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Multiple-choice based on your lecture.</p>
          <Button variant="outline" onClick={() => setReveal((v) => !v)}>{reveal ? "Hide" : "Reveal"} answers</Button>
        </div>
        <div className="space-y-4">
          {quiz.length === 0 ? (
            <Card className="p-5 text-muted-foreground">Provide a transcript to generate quizzes.</Card>
          ) : quiz.map((q) => (
            <Card key={q.id} className="p-5">
              <p className="font-medium">{q.question}</p>
              <ul className="mt-3 space-y-2">
                {q.options.map((o, idx) => (
                  <li key={idx} className={idx === q.answerIndex && reveal ? "text-green-600" : ""}>
                    <span className="mr-2">{String.fromCharCode(65 + idx)}.</span>{o}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="flash">
        {cards.length === 0 ? (
          <Card className="p-5 text-muted-foreground">Provide a transcript to generate flashcards.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((c, i) => (
              <div key={i} className="group [perspective:1000px]">
                <div className="relative h-36 w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  <Card className="absolute inset-0 grid place-items-center p-4 [backface-visibility:hidden]">
                    <p className="font-semibold text-center">{c.front}</p>
                  </Card>
                  <Card className="absolute inset-0 grid place-items-center p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <p className="text-center text-sm text-muted-foreground">{c.back}</p>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
