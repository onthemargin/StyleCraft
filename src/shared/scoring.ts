import type { EvaluationScores, Iteration, SubScores } from "./types.ts";
import {
  FIDELITY_CAP_OVERALL,
  FIDELITY_FLOOR,
  SCORE_WEIGHTS,
  TARGET_SCORE,
} from "./constants.ts";

/**
 * Weighted overall from the four sub-scores. Capped when fidelity is too low,
 * so a rewrite can't "win" by drifting away from the original meaning.
 */
export function computeOverall(sub: SubScores): number {
  const weighted =
    sub.voiceMatch * SCORE_WEIGHTS.voiceMatch +
    sub.diction * SCORE_WEIGHTS.diction +
    sub.tone * SCORE_WEIGHTS.tone +
    sub.fidelity * SCORE_WEIGHTS.fidelity;
  const overall = Math.round(weighted);
  if (sub.fidelity < FIDELITY_FLOOR) return Math.min(overall, FIDELITY_CAP_OVERALL);
  return overall;
}

/** Attach the derived overall to a set of sub-scores. */
export function toEvaluationScores(sub: SubScores): EvaluationScores {
  return { ...sub, overall: computeOverall(sub) };
}

/** overall ≥ target flips a "target voice reached" badge (does NOT stop the loop). */
export function reachedTarget(overall: number): boolean {
  return overall >= TARGET_SCORE;
}

/** An iteration regressed if its overall fell vs the previous overall. */
export function isRegression(
  prevOverall: number | null,
  overall: number,
): boolean {
  return prevOverall !== null && overall < prevOverall;
}

/**
 * The winning iteration: highest overall among SCORED iterations. Unscored
 * iterations (Coach failed) are never eligible. Ties break toward the EARLIER
 * iteration (the model got there in fewer steps). Returns null if none scored.
 */
export function pickBest(iterations: Iteration[]): Iteration | null {
  let best: Iteration | null = null;
  for (const it of iterations) {
    if (!it.scored || !it.scores) continue;
    if (best === null || it.scores.overall > best.scores!.overall) {
      best = it;
    }
  }
  return best;
}

export function pickBestIndex(iterations: Iteration[]): number {
  const best = pickBest(iterations);
  return best ? iterations.indexOf(best) : -1;
}
