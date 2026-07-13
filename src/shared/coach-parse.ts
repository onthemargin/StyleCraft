import { repairAndParse } from "./json-repair.ts";
import { coachRawSchema } from "./schema.ts";
import { toEvaluationScores } from "./scoring.ts";
import { dedupeInstructions } from "./instructions.ts";
import type { CoachResponse, Critique } from "./types.ts";

export type CoachParseResult =
  | { ok: true; data: CoachResponse }
  | { ok: false; error: string };

/**
 * Span-anchored critique degradation: if the Coach quotes a `span` that isn't a
 * verbatim (case-insensitive) substring of the draft, blank the span so the UI
 * shows the comment as plain text rather than a false highlight.
 */
export function verifySpans(critique: Critique[], draft: string): Critique[] {
  const haystack = draft.toLowerCase();
  return critique.map(({ span, comment }) => {
    const s = (span ?? "").trim();
    if (s && haystack.includes(s.toLowerCase())) return { span: s, comment };
    return { span: "", comment };
  });
}

/**
 * Parse raw Coach model text → validated CoachResponse (with derived overall),
 * or a graceful failure. Never throws.
 */
export function parseCoachOutput(raw: string, draft: string): CoachParseResult {
  const parsed = repairAndParse(raw);
  if (parsed === null) {
    return { ok: false, error: "Coach did not return valid JSON" };
  }
  const result = coachRawSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: `Coach JSON failed validation: ${result.error.issues[0]?.message ?? "shape mismatch"}`,
    };
  }
  return {
    ok: true,
    data: {
      scores: toEvaluationScores(result.data.scores),
      critique: verifySpans(result.data.critique, draft),
      nextInstructions: dedupeInstructions(result.data.nextInstructions),
    },
  };
}
