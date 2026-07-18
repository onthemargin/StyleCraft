import type {
  AuthorTarget,
  CoachRequest,
  CoachResult,
  EvaluationScores,
  Iteration,
  TextMetrics,
  WriterRequest,
} from "./types.ts";
import { ITERATIONS } from "./constants.ts";
import { computeMetrics } from "./text-metrics.ts";
import { isRegression, pickBest, pickBestIndex } from "./scoring.ts";
import { dedupeInstructions } from "./instructions.ts";

// The 5-iteration hill climb, extracted from any UI so it can be unit-tested
// headlessly and reused by the sample generator. Writer/Coach are injected —
// fetch wrappers in the browser, direct Vertex services in the spike.

export interface WriterFn {
  (req: WriterRequest): Promise<{ text: string; ms: number }>;
}
export interface CoachFn {
  (req: CoachRequest): Promise<{ result: CoachResult; ms: number }>;
}

export interface ClimbCallbacks {
  onWriterDone?(
    iterationNumber: number,
    draft: string,
    metrics: TextMetrics,
    inputText: string,
  ): void;
  onCoachDone?(iteration: Iteration): void;
}

export interface ClimbOptions {
  originalText: string;
  author: AuthorTarget;
  writer: WriterFn;
  coach: CoachFn;
  iterations?: number;
  signal?: AbortSignal;
  callbacks?: ClimbCallbacks;
}

export interface ClimbResult {
  originalText: string;
  author: AuthorTarget;
  iterations: Iteration[];
  winnerIndex: number;
}

export async function runClimb(opts: ClimbOptions): Promise<ClimbResult> {
  const { originalText, author, writer, coach, callbacks } = opts;
  const iterations = opts.iterations ?? ITERATIONS;

  let currentText = originalText;
  let bestText = originalText;
  let instructions: string[] = [];
  let prevDraft: string | null = null;
  let prevScores: EvaluationScores | null = null;
  const results: Iteration[] = [];

  for (let i = 1; i <= iterations; i++) {
    throwIfAborted(opts.signal);

    const w = await writer({
      originalText,
      currentText,
      author,
      instructions,
      iterationNumber: i,
    });
    const metrics = computeMetrics(w.text);
    callbacks?.onWriterDone?.(i, w.text, metrics, currentText);

    throwIfAborted(opts.signal);

    const c = await coach({
      originalText,
      draft: w.text,
      prevDraft,
      prevScores,
      author,
      metrics,
    });

    const scored = c.result.ok;
    const scores = c.result.ok ? c.result.scores : null;
    const iter: Iteration = {
      iterationNumber: i,
      inputText: currentText,
      outputText: w.text,
      scores,
      critique: c.result.ok ? c.result.critique : [],
      nextInstructions: c.result.ok ? c.result.nextInstructions : [],
      metrics,
      regressed: scored ? isRegression(prevScores?.overall ?? null, scores!.overall) : false,
      scored,
      writerMs: w.ms,
      coachMs: c.ms,
    };
    results.push(iter);
    callbacks?.onCoachDone?.(iter);

    if (scored && scores) {
      // F12: the Coach returns a consolidated replacement set (deduped/capped).
      instructions = dedupeInstructions(iter.nextInstructions);
      // F13: hill climb — always advance from the best draft so far. If this
      // draft regressed (or drifted below fidelity, which caps its overall so it
      // can't be best), we resume from the peak instead of compounding a worse
      // draft. The Coach's next relative judgment is likewise anchored to it.
      const best = pickBest(results) ?? iter;
      bestText = best.outputText;
      currentText = bestText;
      prevScores = best.scores;
      prevDraft = best.outputText;
    } else {
      // F18: unscored iteration — keep prior instructions, continue from this draft.
      currentText = w.text;
      prevDraft = w.text;
    }
  }

  return { originalText, author, iterations: results, winnerIndex: pickBestIndex(results) };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Run cancelled", "AbortError");
}
