import type {
  Critique,
  EvaluationScores,
  Iteration,
  TextMetrics,
} from "../shared/types.ts";

/** Normalized per-iteration view model shared by the live loop and gallery replay. */
export interface LiveCard {
  iterationNumber: number;
  inputText: string;
  outputText: string;
  metrics: TextMetrics;
  status: "scoring" | "scored" | "failed";
  scores: EvaluationScores | null;
  critique: Critique[];
  regressed: boolean;
  writerMs: number;
  coachMs: number;
}

export function iterationToCard(it: Iteration): LiveCard {
  return {
    iterationNumber: it.iterationNumber,
    inputText: it.inputText,
    outputText: it.outputText,
    metrics: it.metrics,
    status: it.scored ? "scored" : "failed",
    scores: it.scores,
    critique: it.critique,
    regressed: it.regressed,
    writerMs: it.writerMs,
    coachMs: it.coachMs,
  };
}
