import { diffWords } from "../diff.ts";

const join = (before: string, after: string) => {
  const toks = diffWords(before, after);
  const rebuiltAfter = toks
    .filter((t) => t.op !== "remove")
    .map((t) => t.text)
    .join("");
  const rebuiltBefore = toks
    .filter((t) => t.op !== "add")
    .map((t) => t.text)
    .join("");
  return { rebuiltAfter, rebuiltBefore };
};

describe("diffWords", () => {
  it("marks everything 'same' for identical text", () => {
    const toks = diffWords("a b c", "a b c");
    expect(toks.every((t) => t.op === "same")).toBe(true);
  });

  it("reconstructs both sides losslessly", () => {
    const before = "The meeting was good and long.";
    const after = "The meeting was short.";
    const { rebuiltAfter, rebuiltBefore } = join(before, after);
    expect(rebuiltBefore).toBe(before);
    expect(rebuiltAfter).toBe(after);
  });

  it("captures a substitution as remove + add", () => {
    const toks = diffWords("good", "bad");
    expect(toks.some((t) => t.op === "remove" && t.text.includes("good"))).toBe(true);
    expect(toks.some((t) => t.op === "add" && t.text.includes("bad"))).toBe(true);
  });
});
