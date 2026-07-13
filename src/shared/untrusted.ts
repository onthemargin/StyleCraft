// Trust-boundary helpers (ported from clawnicle/onframe). User text and any
// model-emitted instruction that gets fed back into a prompt are UNTRUSTED:
// they must not be able to close their delimiter and continue as trusted
// prompt text, or smuggle their own instructions into the Writer.

const FENCE_OPEN = "<UNTRUSTED_TEXT>";
const FENCE_CLOSE = "</UNTRUSTED_TEXT>";

// C0 + C1 control characters (excluding ordinary whitespace, which the \s pass
// collapses next).
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

/** Collapse control chars + whitespace and hard-cap length so a value cannot
 *  leave its label line. */
export function oneLine(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Defang any attempt to forge the untrusted delimiter within the payload. */
export function neutralizeUntrustedTags(text: string): string {
  return String(text ?? "").replace(
    /<(\/?)\s*UNTRUSTED_TEXT\s*>/gi,
    "[$1UNTRUSTED_TEXT]",
  );
}

/** Wrap untrusted content in a labelled, un-forgeable fence for a prompt. */
export function fenceUntrusted(text: string): string {
  return `${FENCE_OPEN}\n${neutralizeUntrustedTags(text)}\n${FENCE_CLOSE}`;
}
