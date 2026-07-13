// Core shared types. Isomorphic — no runtime deps, safe in browser + node.

export const AUTHOR_IDS = [
  "hemingway",
  "twain",
  "orwell",
  "austen",
  "wilde",
  "franklin",
] as const;

export type AuthorTarget = (typeof AUTHOR_IDS)[number];

/** The four dimensions the Coach judges. */
export interface SubScores {
  /** sentence rhythm & structure like the author */
  voiceMatch: number;
  /** word choice & register */
  diction: number;
  /** attitude & register match */
  tone: number;
  /** preserves the original meaning (guards against invention) */
  fidelity: number;
}

/** Sub-scores plus the derived, weighted overall (computed by us, not the model). */
export interface EvaluationScores extends SubScores {
  overall: number;
}

/** Span-anchored critique: quote the problem phrase, then the fix. */
export interface Critique {
  span: string;
  comment: string;
}

/** Deterministic, locally-computed text metrics (identical mock or real). */
export interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLen: number;
  adverbCount: number;
  hedgeCount: number;
}

/** One completed round of the loop. `scored=false` when the Coach failed for
 *  this iteration (rendered, but excluded from pickBest). */
export interface Iteration {
  iterationNumber: number;
  inputText: string;
  outputText: string;
  scores: EvaluationScores | null;
  critique: Critique[];
  nextInstructions: string[];
  metrics: TextMetrics;
  regressed: boolean;
  scored: boolean;
  writerMs: number;
  coachMs: number;
}

/** A pre-generated run shipped in the gallery. */
export interface SampleRun {
  id: string;
  label: string;
  author: AuthorTarget;
  originalText: string;
  iterations: Iteration[];
  winnerIndex: number;
  generatedAt: string;
  /** false = real (curated) Vertex output; true = mock/simulated. */
  simulated: boolean;
}

export type RunPhase =
  | "gallery"
  | "idle"
  | "writing"
  | "evaluating"
  | "done"
  | "error";

// ── API contracts ────────────────────────────────────────────────────────────

export interface WriterRequest {
  originalText: string;
  currentText: string;
  author: AuthorTarget;
  /** Consolidated Coach instructions accumulated so far (empty on iteration 1). */
  instructions: string[];
  iterationNumber: number;
}

export interface WriterResponse {
  text: string;
}

export interface CoachRequest {
  originalText: string;
  draft: string;
  /** Previous iteration's draft + scores, for relative judging (null on iter 1). */
  prevDraft: string | null;
  prevScores: EvaluationScores | null;
  author: AuthorTarget;
  metrics: TextMetrics;
}

/** Coach success payload. `overall` is filled in server-side via scoring. */
export interface CoachResponse {
  scores: EvaluationScores;
  critique: Critique[];
  nextInstructions: string[];
}

/** Coach outcome as seen by the orchestrator — never throws for a scoring
 *  failure; carries `ok:false` so the loop can continue (F18). */
export type CoachResult =
  | ({ ok: true } & CoachResponse)
  | { ok: false; error: string };

export interface ApiError {
  error: string;
  retryAfter?: number;
}
