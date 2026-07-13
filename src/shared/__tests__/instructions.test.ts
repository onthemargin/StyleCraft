import {
  dedupeInstructions,
  mergeAndDeduplicate,
  normalizeInstruction,
} from "../instructions.ts";
import { MAX_INSTRUCTIONS } from "../constants.ts";

describe("normalizeInstruction", () => {
  it("lowercases, collapses whitespace, strips trailing punctuation", () => {
    expect(normalizeInstruction("Shorten   sentences.")).toBe("shorten sentences");
    expect(normalizeInstruction("shorten sentences")).toBe("shorten sentences");
  });
});

describe("dedupeInstructions", () => {
  it("dedupes case/whitespace/punctuation-insensitively, order-stable", () => {
    const out = dedupeInstructions([
      "Shorten sentences",
      "shorten sentences.",
      "Use shorter sentences",
    ]);
    expect(out).toEqual(["Shorten sentences", "Use shorter sentences"]);
  });

  it("drops empties and trims", () => {
    expect(dedupeInstructions(["", "  ", "Cut hedges"])).toEqual(["Cut hedges"]);
  });

  it("hard-caps the list length", () => {
    const many = Array.from({ length: 20 }, (_, i) => `instruction ${i}`);
    expect(dedupeInstructions(many)).toHaveLength(MAX_INSTRUCTIONS);
  });
});

describe("mergeAndDeduplicate", () => {
  it("keeps existing first, then new, deduped", () => {
    expect(
      mergeAndDeduplicate(["Cut hedges"], ["cut hedges.", "Use concrete nouns"]),
    ).toEqual(["Cut hedges", "Use concrete nouns"]);
  });
});
