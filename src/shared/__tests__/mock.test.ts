import { mockWriterRewrite } from "../mock/writer.ts";
import { mockCoachEvaluate } from "../mock/coach.ts";
import { computeMetrics } from "../text-metrics.ts";
import { ITERATIONS } from "../constants.ts";
import type { CoachRequest, EvaluationScores } from "../types.ts";

const ORIGINAL =
  "The meeting was good and we discussed many things that will probably help us in the future.";

/** Drive the mock loop the way the orchestrator will. */
function runMockLoop(author: "hemingway") {
  let currentText = ORIGINAL;
  let prevScores: EvaluationScores | null = null;
  let prevDraft: string | null = null;
  const overalls: number[] = [];
  const drafts: string[] = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    const draft = mockWriterRewrite({
      originalText: ORIGINAL,
      currentText,
      author,
      instructions: [],
      iterationNumber: i,
    });
    const metrics = computeMetrics(draft);
    const req: CoachRequest = {
      originalText: ORIGINAL,
      draft,
      prevDraft,
      prevScores,
      author,
      metrics,
    };
    const evaln = mockCoachEvaluate(req);
    overalls.push(evaln.scores.overall);
    drafts.push(draft);
    prevScores = evaln.scores;
    prevDraft = draft;
    currentText = draft;
  }
  return { overalls, drafts };
}

describe("mock loop demonstrates a genuine climb", () => {
  it("ends higher than it starts", () => {
    const { overalls } = runMockLoop("hemingway");
    expect(overalls[overalls.length - 1]).toBeGreaterThan(overalls[0]);
  });

  it("tightens the text: fewer hedges and shorter sentences by the end", () => {
    const { drafts } = runMockLoop("hemingway");
    const first = computeMetrics(drafts[0]);
    const last = computeMetrics(drafts[drafts.length - 1]);
    expect(last.hedgeCount).toBeLessThanOrEqual(first.hedgeCount);
    expect(last.avgSentenceLen).toBeLessThanOrEqual(first.avgSentenceLen);
  });

  it("is deterministic across runs", () => {
    expect(runMockLoop("hemingway").overalls).toEqual(
      runMockLoop("hemingway").overalls,
    );
  });
});

describe("mockCoachEvaluate", () => {
  it("scores a tight Hemingway-ish draft above a loose one", () => {
    const tight = "The meeting ran an hour. We made three decisions.";
    const loose = ORIGINAL;
    const score = (draft: string) =>
      mockCoachEvaluate({
        originalText: ORIGINAL,
        draft,
        prevDraft: null,
        prevScores: null,
        author: "hemingway",
        metrics: computeMetrics(draft),
      }).scores.overall;
    expect(score(tight)).toBeGreaterThan(score(loose));
  });
});
