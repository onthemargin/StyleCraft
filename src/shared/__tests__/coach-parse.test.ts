import { parseCoachOutput, verifySpans } from "../coach-parse.ts";

const DRAFT = "The meeting ran an hour. We made three decisions.";

const validRaw = (over?: Record<string, unknown>) =>
  JSON.stringify({
    scores: { voiceMatch: 80, diction: 78, tone: 82, fidelity: 90 },
    critique: [{ span: "ran an hour", comment: "good, concrete time reference" }],
    nextInstructions: ["Cut the hedge", "Use concrete nouns"],
    ...over,
  });

describe("parseCoachOutput — happy paths", () => {
  it("parses valid JSON and derives overall", () => {
    const r = parseCoachOutput(validRaw(), DRAFT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 80*.35+78*.30+82*.20+90*.15 = 28+23.4+16.4+13.5 = 81.3 → 81
      expect(r.data.scores.overall).toBe(81);
      expect(r.data.nextInstructions).toHaveLength(2);
    }
  });

  it("strips a ```json code fence", () => {
    const r = parseCoachOutput("```json\n" + validRaw() + "\n```", DRAFT);
    expect(r.ok).toBe(true);
  });

  it('repairs "+"-signed integers', () => {
    const raw = validRaw().replace("80", "+80");
    const r = parseCoachOutput(raw, DRAFT);
    expect(r.ok).toBe(true);
  });
});

describe("parseCoachOutput — malformed / graceful degradation", () => {
  it("fails on non-JSON", () => {
    const r = parseCoachOutput("I'm sorry, I can't do that.", DRAFT);
    expect(r.ok).toBe(false);
  });

  it("fails on out-of-range scores", () => {
    const r = parseCoachOutput(
      validRaw({ scores: { voiceMatch: 150, diction: 50, tone: 50, fidelity: 50 } }),
      DRAFT,
    );
    expect(r.ok).toBe(false);
  });

  it("fails on non-integer scores", () => {
    const r = parseCoachOutput(
      validRaw({ scores: { voiceMatch: 80.5, diction: 50, tone: 50, fidelity: 50 } }),
      DRAFT,
    );
    expect(r.ok).toBe(false);
  });

  it("fails on missing fields", () => {
    const r = parseCoachOutput(JSON.stringify({ scores: {} }), DRAFT);
    expect(r.ok).toBe(false);
  });

  it("degrades a span that isn't verbatim in the draft", () => {
    const r = parseCoachOutput(
      validRaw({ critique: [{ span: "not in the draft at all", comment: "keep comment" }] }),
      DRAFT,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.critique[0].span).toBe("");
      expect(r.data.critique[0].comment).toBe("keep comment");
    }
  });
});

describe("verifySpans", () => {
  it("keeps verbatim spans (case-insensitive), blanks the rest", () => {
    const out = verifySpans(
      [
        { span: "THREE decisions", comment: "a" },
        { span: "nonexistent", comment: "b" },
      ],
      DRAFT,
    );
    expect(out[0].span).toBe("THREE decisions");
    expect(out[1].span).toBe("");
  });
});
