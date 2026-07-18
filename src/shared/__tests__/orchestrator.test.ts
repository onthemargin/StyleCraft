import { runClimb, type CoachFn, type WriterFn } from "../orchestrator.ts";
import type { EvaluationScores } from "../types.ts";

const scores = (overall: number, fidelity = 90): EvaluationScores => ({
  voiceMatch: overall,
  diction: overall,
  tone: overall,
  fidelity,
  overall,
});

describe("runClimb hill climbing", () => {
  // A writer that tags each draft by iteration and records the currentText it was
  // handed, so we can assert which draft the next iteration builds on.
  function scriptedRun(overalls: number[]) {
    const writerInputs: string[] = [];
    const coachPrevDrafts: (string | null)[] = [];

    const writer: WriterFn = async (req) => {
      writerInputs.push(req.currentText);
      return { text: `draft-${req.iterationNumber}`, ms: 0 };
    };

    let call = 0;
    const coach: CoachFn = async (req) => {
      coachPrevDrafts.push(req.prevDraft);
      const overall = overalls[call++];
      return {
        result: { ok: true, scores: scores(overall), critique: [], nextInstructions: [] },
        ms: 0,
      };
    };

    return { writer, coach, writerInputs, coachPrevDrafts };
  }

  it("resumes the next iteration from the best draft after a regression", async () => {
    // iter2 (80) is the peak; iter3 (60) regresses. iter4 must build on draft-2.
    const { writer, coach, writerInputs, coachPrevDrafts } = scriptedRun([50, 80, 60, 85, 88]);

    await runClimb({ originalText: "orig", author: "hemingway", writer, coach, iterations: 5 });

    // Writer input per iteration: orig, then best-so-far each time.
    expect(writerInputs).toEqual(["orig", "draft-1", "draft-2", "draft-2", "draft-4"]);
    // The Coach also judges the new draft against the best-so-far, not the regressed one.
    expect(coachPrevDrafts).toEqual([null, "draft-1", "draft-2", "draft-2", "draft-4"]);
  });

  it("advances monotonically when every iteration improves", async () => {
    const { writer, coach, writerInputs } = scriptedRun([44, 66, 82, 87, 91]);
    await runClimb({ originalText: "orig", author: "twain", writer, coach, iterations: 5 });
    expect(writerInputs).toEqual(["orig", "draft-1", "draft-2", "draft-3", "draft-4"]);
  });
});
