import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "violet", className: "bg-violet-500", label: "Violet" },
  { id: "emerald", className: "bg-emerald-500", label: "Emerald" },
  { id: "rose", className: "bg-rose-500", label: "Rose" },
  { id: "amber", className: "bg-amber-500", label: "Amber" },
  { id: "sky", className: "bg-sky-500", label: "Sky" },
];

function applyTheme(id: string) {
  const root = document.documentElement;
  if (id === "violet") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
  try { localStorage.setItem("theme", id); } catch {}
}

export function SiteHeader() {
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem("theme") || "violet"; } catch { return "violet"; }
  });
  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <header className={cn("sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/60")} aria-label="Site header">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="inline-grid place-items-center size-8 rounded-lg bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground font-bold">∑</span>
          <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">EchoNotes</span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#studio" className="text-muted-foreground hover:text-foreground">Studio</a>
          <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1" aria-label="Theme picker">
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={() => setTheme(t.id)}
                className={cn("size-5 rounded-full border", t.className, theme===t.id?"ring-2 ring-ring":"opacity-80 hover:opacity-100")}/>
            ))}
          </div>
          <a href="#studio"><Button>Start recording</Button></a>
        </div>
      </div>
    </header>
  );
}
