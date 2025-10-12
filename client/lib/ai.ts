const STOPWORDS = new Set<string>([
  "the","is","in","at","of","a","an","and","to","for","on","with","as","by","it","are","be","or","that","this","from","was","were","has","have","had","but","not","we","they","you","i","he","she","them","his","her","their","our","your","its","which","who","whom","what","when","where","why","how","can","could","should","would","will","may","might","also","than","then","so","if"
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && w.length > 2);
}

function topN<T>(arr: Array<[T, number]>, n: number): Array<[T, number]> {
  return arr.sort((a, b) => b[1] - a[1]).slice(0, n);
}

function frequency(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
  return map;
}

function scoreSentence(sentence: string, weights: Map<string, number>): number {
  const tokens = tokenize(sentence);
  return tokens.reduce((acc, t) => acc + (weights.get(t) || 0), 0);
}

export function normalizeTranscript(text: string): string {
  // Collapse repeated words: "AI AI AI" -> "AI"
  let t = text.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");
  // Normalize whitespace and newlines
  t = t.replace(/[\r\t]+/g, " ").replace(/\s+/g, " ").trim();
  // Deduplicate sentences while preserving order
  const sentences = splitSentences(t);
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const s of sentences) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
    }
  }
  return deduped.join(" ");
}

export function summarize(text: string, maxSentences = 6): string[] {
  const cleaned = normalizeTranscript(text);
  const sentences = splitSentences(cleaned);
  if (sentences.length <= maxSentences) return sentences;
  const tokens = tokenize(cleaned);
  const freq = frequency(tokens);
  const maxFreq = Math.max(...Array.from(freq.values()));
  for (const [k, v] of freq) freq.set(k, v / maxFreq);
  const scored = sentences.map((s, i) => [i, scoreSentence(s, freq)] as const);
  const selected = topN(scored as any, Math.min(maxSentences, sentences.length))
    .map(([i]) => i as number)
    .sort((a, b) => a - b);
  return selected.map((i) => sentences[i]);
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function randomChoice<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export function extractKeyTerms(text: string, n = 8): string[] {
  const cleaned = normalizeTranscript(text);
  const tokens = tokenize(cleaned).filter((t) => !/\d+/.test(t));
  const freq = frequency(tokens);
  const terms = topN(Array.from(freq.entries()), n * 3).map(([w]) => w);
  return unique(terms).slice(0, n);
}

export function generateNotes(text: string): string[] {
  const cleaned = normalizeTranscript(text);
  const bullets = summarize(cleaned, 8)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const uniqueBullets = bullets.filter((b) => {
    const key = b.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return uniqueBullets;
}

export function generateQuiz(text: string): QuizQuestion[] {
  const cleaned = normalizeTranscript(text);
  const sentences = splitSentences(cleaned);
  const terms = extractKeyTerms(cleaned, 8);
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < Math.min(5, terms.length); i++) {
    const term = terms[i];
    const containing = sentences.find((s) => s.toLowerCase().includes(term));
    const correct = containing ? containing : `${term.charAt(0).toUpperCase() + term.slice(1)} is a key concept discussed in the lecture.`;
    const distractorPool = sentences.filter((s) => s !== containing && s.length > 40);
    const distractors = randomChoice(distractorPool.length ? distractorPool : sentences, 3)
      .map((s) => s.replace(/\s+/g, " "));
    const options = unique([correct, ...distractors]).slice(0, 4);
    const answerIndex = options.indexOf(correct);
    questions.push({
      id: `${i}-${term}`,
      question: `Which statement best reflects the lecture regarding “${term}”?`,
      options,
      answerIndex: answerIndex >= 0 ? answerIndex : 0,
    });
  }
  return questions;
}

export interface Flashcard { front: string; back: string; }

export function generateFlashcards(text: string): Flashcard[] {
  const cleaned = normalizeTranscript(text);
  const terms = extractKeyTerms(cleaned, 10);
  const sentences = splitSentences(cleaned);
  const cards: Flashcard[] = terms.map((t) => {
    const s = sentences.find((x) => x.toLowerCase().includes(t));
    const back = s ? s : `Key idea about ${t}.`;
    return {
      front: t.charAt(0).toUpperCase() + t.slice(1),
      back,
    };
  });
  return cards.slice(0, 12);
}
