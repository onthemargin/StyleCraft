import {
  computeMetrics,
  countAdverbs,
  countHedges,
  countWords,
  splitSentences,
} from "../text-metrics.ts";

describe("countWords", () => {
  it("counts words, ignoring punctuation", () => {
    expect(countWords("The meeting was good.")).toBe(4);
    expect(countWords("well-being isn't easy")).toBe(3);
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("splitSentences", () => {
  it("splits on sentence terminators and drops empties", () => {
    expect(splitSentences("One. Two! Three?")).toHaveLength(3);
    expect(splitSentences("No terminator here")).toHaveLength(1);
    expect(splitSentences("")).toHaveLength(0);
  });
});

describe("countAdverbs", () => {
  it("counts -ly adverbs but excludes common -ly non-adverbs", () => {
    expect(countAdverbs("He quickly ran and slowly walked.")).toBe(2);
    expect(countAdverbs("only the early family reply")).toBe(0);
  });
});

describe("countHedges", () => {
  it("counts single- and multi-word hedges", () => {
    expect(
      countHedges("We discussed many things that will probably help in the future."),
    ).toBe(3); // "many things" + "probably" + "in the future"
    expect(countHedges("A crisp, direct sentence.")).toBe(0);
  });
});

describe("computeMetrics", () => {
  it("reports the reliable core for the demo sentence", () => {
    const m = computeMetrics(
      "The meeting was good and we discussed many things that will probably help us in the future.",
    );
    expect(m.sentenceCount).toBe(1);
    expect(m.wordCount).toBe(17);
    expect(m.avgSentenceLen).toBe(17);
    expect(m.hedgeCount).toBeGreaterThanOrEqual(3);
  });

  it("guards divide-by-zero on empty input", () => {
    const m = computeMetrics("");
    expect(m.sentenceCount).toBe(0);
    expect(m.avgSentenceLen).toBe(0);
  });
});
