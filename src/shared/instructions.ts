import { MAX_INSTRUCTIONS, MAX_INSTRUCTION_LEN } from "./constants.ts";

/** Normalize for dedup: lowercase, collapse whitespace, strip trailing
 *  punctuation. Two instructions that differ only in case/spacing/period are
 *  the same instruction. */
export function normalizeInstruction(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!;,\s]+$/g, "")
    .trim();
}

/**
 * Order-stable, case/whitespace-insensitive dedup + hard cap. Also trims each
 * item to MAX_INSTRUCTION_LEN and drops empties. Used defensively even though
 * the Coach is asked to return an already-consolidated replacement set.
 */
export function dedupeInstructions(
  items: string[],
  cap = MAX_INSTRUCTIONS,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const trimmed = (raw ?? "").trim().slice(0, MAX_INSTRUCTION_LEN);
    if (!trimmed) continue;
    const key = normalizeInstruction(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Merge an existing set with an incoming one, existing first, deduped + capped.
 * (The live loop replaces with the Coach's consolidated set; this remains for
 * defensive accumulation and is unit-tested per the spec.)
 */
export function mergeAndDeduplicate(
  existing: string[],
  incoming: string[],
  cap = MAX_INSTRUCTIONS,
): string[] {
  return dedupeInstructions([...existing, ...incoming], cap);
}
