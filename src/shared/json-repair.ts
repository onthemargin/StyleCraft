// Isomorphic JSON-repair helpers for real Gemini output quirks. Pure — no node
// deps — so the browser, server, and tests all share one implementation.

/** Strip a ```json … ``` fence if the model wrapped its JSON in one. */
export function stripCodeFences(text: string): string {
  if (typeof text !== "string") return text;
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fence ? fence[1].trim() : trimmed;
}

/** Gemini sometimes emits "+3" instead of "3" inside JSON; drop the leading +. */
export function stripPlusSignedIntegers(text: string): string {
  return text.replace(/([:[,\s])\+(\d)/g, "$1$2");
}

/** Apply both repairs then JSON.parse. Returns null on failure (never throws). */
export function repairAndParse(raw: string): unknown | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const cleaned = stripPlusSignedIntegers(stripCodeFences(raw));
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
