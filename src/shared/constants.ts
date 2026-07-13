// Shared tunables — used by the SPA, the Express routes, and the sample script.

/** Fixed number of Writer→Coach rounds per run. Not user-configurable. */
export const ITERATIONS = 5;

/** Short-form input only: a sentence or short paragraph. */
export const MIN_INPUT_CHARS = 8;
export const MAX_INPUT_CHARS = 500;

/** Coach emits a consolidated instruction set each round; keep it small so a
 *  weak Writer can actually follow it (and so a hijacked Coach can't emit a
 *  prompt-sized payload). */
export const MAX_INSTRUCTIONS = 8;
export const MAX_INSTRUCTION_LEN = 140;

/** Critique bounds (span-anchored). */
export const MAX_CRITIQUE_ITEMS = 6;
export const MAX_SPAN_LEN = 300;
export const MAX_COMMENT_LEN = 400;

/** Reaching this overall score flips a "target voice reached" badge — it does
 *  NOT stop the loop; all ITERATIONS always run. */
export const TARGET_SCORE = 90;

/** Below this fidelity the rewrite has drifted from the original meaning:
 *  overall is capped, and the loop rebases off the best-so-far text. */
export const FIDELITY_FLOOR = 50;
export const FIDELITY_CAP_OVERALL = 55;

/** overall = weighted sum of the four sub-scores. */
export const SCORE_WEIGHTS = {
  voiceMatch: 0.35,
  diction: 0.3,
  tone: 0.2,
  fidelity: 0.15,
} as const;
