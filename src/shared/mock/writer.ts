import type { WriterRequest } from "../types.ts";
import { getAuthor } from "../authors.ts";
import { splitSentences } from "../text-metrics.ts";

// Deterministic, keyless stand-in for the cloud Writer. It does NOT imitate a
// voice with any fidelity — it applies progressively stronger "tightening"
// transforms keyed off the iteration number so that, run in sequence, the
// metrics move toward the author's band and the mock Coach's score climbs.
// Clearly labelled "simulated" in the UI.

const HEDGE_RE =
  /\b(?:probably|maybe|perhaps|possibly|somewhat|really|very|just|basically|actually|quite|rather|fairly|a bit|kind of|sort of|many things|in the future)\b/gi;

function removeFirstMatches(text: string, re: RegExp, n: number): string {
  if (n <= 0) return text;
  let count = 0;
  const out = text.replace(new RegExp(re.source, "gi"), (m) =>
    count++ < n ? "" : m,
  );
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
}

function removeAdverbs(text: string, n: number): string {
  if (n <= 0) return text;
  let count = 0;
  return text
    .replace(/\b([a-z]+ly)\b/gi, (m) => {
      const lower = m.toLowerCase();
      const keep = ["only", "early", "family", "reply", "likely", "lonely"];
      if (keep.includes(lower)) return m;
      return count++ < n ? "" : m;
    })
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

function splitLongSentences(text: string, maxLen: number): string {
  return splitSentences(text)
    .map((s) => {
      const words = s.split(/\s+/);
      if (words.length <= maxLen) return s.endsWith(".") ? s : s + ".";
      // Split at the first coordinating " and " past the midpoint.
      const mid = Math.floor(words.length / 2);
      const andIdx = words.findIndex((w, i) => i >= mid && /^and$/i.test(w));
      if (andIdx === -1) return s + ".";
      const first = words.slice(0, andIdx).join(" ").replace(/,+$/, "");
      const rest = words.slice(andIdx + 1).join(" ");
      const cap = rest.charAt(0).toUpperCase() + rest.slice(1);
      return `${first}. ${cap}.`;
    })
    .join(" ");
}

export function mockWriterRewrite(req: WriterRequest): string {
  const author = getAuthor(req.author);
  const i = req.iterationNumber;
  let text = req.currentText;

  // Progressively stronger with each iteration, one lever at a time so the
  // simulated curve rises in steps rather than jumping to the top at once.
  // One hedge per pass off the *previous* draft, so hedge removal spreads over
  // several iterations instead of finishing at once.
  text = removeFirstMatches(text, HEDGE_RE, 1);
  if (i >= 3) text = splitLongSentences(text, author.voiceCard.sentenceLen.max);
  if (i >= 4) text = removeAdverbs(text, 1);

  // Tidy capitalization of the first letter.
  text = text.trim();
  if (text) text = text.charAt(0).toUpperCase() + text.slice(1);
  return text || req.currentText;
}
