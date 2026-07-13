import type { TextMetrics } from "./types.ts";

// Deterministic, dependency-free text metrics. The "reliable core" only —
// word/sentence counts, average sentence length, adverb and hedge counts.
// No reading-grade or passive-voice heuristics (deliberately: they'd be shaky).
//
// NOTE: on a ≤500-char input (2–4 sentences) these are COARSE anchors — good
// for showing a trend and grounding the Coach, not precise linguistics.

/** Words ending in "-ly" that are not adverbs — excluded from the adverb count. */
const LY_NON_ADVERBS = new Set([
  "only",
  "early",
  "family",
  "reply",
  "supply",
  "apply",
  "rely",
  "italy",
  "ally",
  "bully",
  "jelly",
  "ugly",
  "holy",
  "silly",
  "lonely",
  "likely",
  "lovely",
  "friendly",
  "daily",
  "monthly",
]);

/** Multi-word and single-word hedges that weaken a sentence. */
const HEDGE_PATTERNS: RegExp[] = [
  /\bprobably\b/gi,
  /\bmaybe\b/gi,
  /\bperhaps\b/gi,
  /\bpossibly\b/gi,
  /\bsomewhat\b/gi,
  /\bsomehow\b/gi,
  /\bsort of\b/gi,
  /\bkind of\b/gi,
  /\ba bit\b/gi,
  /\ba little\b/gi,
  /\bquite\b/gi,
  /\brather\b/gi,
  /\bfairly\b/gi,
  /\bpretty much\b/gi,
  /\bi think\b/gi,
  /\bi guess\b/gi,
  /\bi feel like\b/gi,
  /\bit seems\b/gi,
  /\bseems? to\b/gi,
  /\bmany things\b/gi,
  /\bsome things\b/gi,
  /\bin the future\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi,
  /\bjust\b/gi,
  /\bvery\b/gi,
  /\breally\b/gi,
];

export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+(?:\s+|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function countWords(text: string): number {
  const matches = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return matches ? matches.length : 0;
}

export function countAdverbs(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+(?:['-][a-z]+)*/g) ?? [];
  let n = 0;
  for (const w of words) {
    if (w.length > 3 && w.endsWith("ly") && !LY_NON_ADVERBS.has(w)) n++;
  }
  return n;
}

export function countHedges(text: string): number {
  let n = 0;
  for (const re of HEDGE_PATTERNS) {
    const m = text.match(re);
    if (m) n += m.length;
  }
  return n;
}

export function computeMetrics(text: string): TextMetrics {
  const wordCount = countWords(text);
  const sentences = splitSentences(text);
  const sentenceCount = sentences.length;
  const avgSentenceLen =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;
  return {
    wordCount,
    sentenceCount,
    avgSentenceLen,
    adverbCount: countAdverbs(text),
    hedgeCount: countHedges(text),
  };
}
