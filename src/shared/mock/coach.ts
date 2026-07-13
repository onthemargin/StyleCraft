import type { CoachRequest, CoachResponse, Critique } from "../types.ts";
import { getAuthor } from "../authors.ts";
import { toEvaluationScores } from "../scoring.ts";
import { computeMetrics } from "../text-metrics.ts";

// Deterministic, keyless stand-in for the cloud Coach. Scores the draft's real
// metrics against the target author's band, so as the mock Writer tightens the
// text the score climbs. Sub-scores are honest functions of the metrics we
// actually display; diction/tone are derived, and labelled "simulated" in UI.

const clamp = (n: number, lo = 5, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function sentenceLenScore(avg: number, ideal: number, max: number): number {
  if (avg <= 0) return 40;
  const over = Math.max(0, avg - max);
  const dev = Math.abs(avg - ideal);
  return clamp(100 - dev * 3 - over * 5);
}

const HEDGE_RE =
  /\b(?:probably|maybe|perhaps|possibly|somewhat|really|very|just|basically|actually|quite|rather|fairly|many things|in the future)\b/gi;

function firstHedgeSpan(draft: string): string | null {
  const m = draft.match(HEDGE_RE);
  return m ? m[0] : null;
}

export function mockCoachEvaluate(req: CoachRequest): CoachResponse {
  const author = getAuthor(req.author);
  const band = author.voiceCard.sentenceLen;
  const m = req.metrics;

  const voiceMatch = sentenceLenScore(m.avgSentenceLen, band.ideal, band.max);

  const noisePer100 =
    ((m.adverbCount + m.hedgeCount) / Math.max(1, m.wordCount)) * 100;
  const diction = clamp(100 - noisePer100 * 6);

  const tone = clamp(72 - m.hedgeCount * 5 + (voiceMatch - 70) * 0.25);

  // Mock can't judge meaning; assume high fidelity unless the draft collapsed to
  // a fraction of the original (a proxy for drift).
  const origWords = computeMetrics(req.originalText).wordCount;
  const ratio = origWords > 0 ? m.wordCount / origWords : 1;
  const fidelity = ratio < 0.4 ? 55 : clamp(92 - Math.abs(1 - ratio) * 20);

  const scores = toEvaluationScores({ voiceMatch, diction, tone, fidelity });

  // Span-anchored critique + consolidated next instructions.
  const critique: Critique[] = [];
  const nextInstructions: string[] = [];

  if (m.avgSentenceLen > band.max) {
    critique.push({
      span: "",
      comment: `Sentences average ${m.avgSentenceLen} words; ${author.label} runs closer to ${band.ideal}.`,
    });
    nextInstructions.push("Break long sentences into short declaratives.");
  }
  const hedge = firstHedgeSpan(req.draft);
  if (hedge) {
    critique.push({ span: hedge, comment: `"${hedge}" hedges — cut it.` });
    nextInstructions.push("Cut hedges and filler qualifiers.");
  }
  if (m.adverbCount > 1) {
    nextInstructions.push("Remove adverbs; let nouns and verbs carry it.");
  }
  if (nextInstructions.length === 0 && scores.overall < 90) {
    nextInstructions.push(`Sharpen word choice toward ${author.label}'s register.`);
  }

  return { scores, critique, nextInstructions };
}
