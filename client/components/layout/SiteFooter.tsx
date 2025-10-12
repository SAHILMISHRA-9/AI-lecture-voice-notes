export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60">
      <div className="container py-10 text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} EchoNotes. All rights reserved.</p>
        <p>Built for students—convert lectures to notes, quizzes, and flashcards.</p>
      </div>
    </footer>
  );
}
