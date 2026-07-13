import {
  computeOverall,
  isRegression,
  pickBest,
  pickBestIndex,
  reachedTarget,
  toEvaluationScores,
} from "../scoring.ts";
import type { Iteration, SubScores } from "../types.ts";

const sub = (
  voiceMatch: number,
  diction: number,
  tone: number,
  fidelity: number,
): SubScores => ({ voiceMatch, diction, tone, fidelity });

describe("computeOverall", () => {
  it("weights the four sub-scores", () => {
    expect(computeOverall(sub(90, 90, 90, 90))).toBe(90);
    expect(computeOverall(sub(100, 100, 100, 100))).toBe(100);
    // 80*.35 + 70*.30 + 60*.20 + 90*.15 = 28+21+12+13.5 = 74.5 → 75 (fidelity ok)
    expect(computeOverall(sub(80, 70, 60, 90))).toBe(75);
  });

  it("caps overall when fidelity is below the floor", () => {
    // High voice but the meaning drifted — must not win.
    expect(computeOverall(sub(95, 95, 95, 40))).toBe(55);
    expect(computeOverall(sub(100, 100, 100, 0))).toBe(55);
  });
});

describe("reachedTarget", () => {
  it("is true at or above 90", () => {
    expect(reachedTarget(90)).toBe(true);
    expect(reachedTarget(91)).toBe(true);
    expect(reachedTarget(89)).toBe(false);
  });
});

describe("isRegression", () => {
  it("detects a drop vs the previous overall", () => {
    expect(isRegression(72, 68)).toBe(true);
    expect(isRegression(68, 72)).toBe(false);
    expect(isRegression(70, 70)).toBe(false);
    expect(isRegression(null, 50)).toBe(false); // first iteration never regresses
  });
});

describe("pickBest", () => {
  const iter = (n: number, overall: number | null): Iteration => ({
    iterationNumber: n,
    inputText: "in",
    outputText: "out",
    scores: overall === null ? null : { ...sub(overall, overall, overall, overall), overall },
    critique: [],
    nextInstructions: [],
    metrics: {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLen: 0,
      adverbCount: 0,
      hedgeCount: 0,
    },
    regressed: false,
    scored: overall !== null,
    writerMs: 0,
    coachMs: 0,
  });

  it("returns the highest-overall SCORED iteration", () => {
    const its = [iter(1, 45), iter(2, 80), iter(3, 72)];
    expect(pickBest(its)?.iterationNumber).toBe(2);
    expect(pickBestIndex(its)).toBe(1);
  });

  it("excludes unscored iterations", () => {
    const its = [iter(1, 88), iter(2, null), iter(3, 60)];
    expect(pickBest(its)?.iterationNumber).toBe(1);
  });

  it("breaks ties toward the earlier iteration", () => {
    const its = [iter(1, 80), iter(2, 80)];
    expect(pickBest(its)?.iterationNumber).toBe(1);
  });

  it("returns null when nothing scored", () => {
    expect(pickBest([iter(1, null), iter(2, null)])).toBeNull();
    expect(pickBestIndex([iter(1, null)])).toBe(-1);
  });
});

describe("toEvaluationScores", () => {
  it("attaches the derived overall", () => {
    expect(toEvaluationScores(sub(90, 90, 90, 90))).toEqual({
      voiceMatch: 90,
      diction: 90,
      tone: 90,
      fidelity: 90,
      overall: 90,
    });
  });
});
