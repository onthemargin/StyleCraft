import { z } from "zod";
import {
  MAX_COMMENT_LEN,
  MAX_CRITIQUE_ITEMS,
  MAX_INSTRUCTION_LEN,
  MAX_INSTRUCTIONS,
  MAX_SPAN_LEN,
} from "./constants.ts";

// ── Zod: the REAL enforcement of the Coach's raw output ───────────────────────
// Gemini's responseSchema only communicates SHAPE (it strips numeric/length
// bounds, see geminifySchema below), so every semantic bound lives here and
// runs after parse.

const scoreInt = z.number().int().min(0).max(100);

export const subScoresSchema = z.object({
  voiceMatch: scoreInt,
  diction: scoreInt,
  tone: scoreInt,
  fidelity: scoreInt,
});

export const critiqueSchema = z.object({
  span: z.string().max(MAX_SPAN_LEN),
  comment: z.string().min(1).max(MAX_COMMENT_LEN),
});

/** What the Coach model must return (before we compute `overall`). */
export const coachRawSchema = z.object({
  scores: subScoresSchema,
  critique: z.array(critiqueSchema).max(MAX_CRITIQUE_ITEMS),
  nextInstructions: z
    .array(z.string().min(1).max(MAX_INSTRUCTION_LEN))
    .max(MAX_INSTRUCTIONS),
});

export type CoachRaw = z.infer<typeof coachRawSchema>;

// ── Gemini responseSchema (shape-only) ────────────────────────────────────────
// A plain JSON-Schema-ish object handed to Vertex `generationConfig.responseSchema`.
// geminifySchema strips keys Gemini rejects / that blow its "too many states"
// budget; Zod re-imposes the real bounds after parse.

const STRIP_KEYS = [
  "$schema",
  "$id",
  "additionalProperties",
  "format",
  "pattern",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
] as const;

export function geminifySchema<T>(node: T): T {
  const clone = JSON.parse(JSON.stringify(node));
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (!n || typeof n !== "object") return;
    const obj = n as Record<string, unknown>;
    for (const k of STRIP_KEYS) delete obj[k];
    Object.values(obj).forEach(walk);
  };
  walk(clone);
  return clone;
}

const scoreProp = { type: "integer", minimum: 0, maximum: 100 } as const;

/** Full-fidelity schema (with bounds) — geminified at use for Vertex. */
export const COACH_JSON_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        voiceMatch: scoreProp,
        diction: scoreProp,
        tone: scoreProp,
        fidelity: scoreProp,
      },
      required: ["voiceMatch", "diction", "tone", "fidelity"],
    },
    critique: {
      type: "array",
      maxItems: MAX_CRITIQUE_ITEMS,
      items: {
        type: "object",
        properties: {
          span: { type: "string", maxLength: MAX_SPAN_LEN },
          comment: { type: "string", maxLength: MAX_COMMENT_LEN },
        },
        required: ["span", "comment"],
      },
    },
    nextInstructions: {
      type: "array",
      maxItems: MAX_INSTRUCTIONS,
      items: { type: "string", maxLength: MAX_INSTRUCTION_LEN },
    },
  },
  required: ["scores", "critique", "nextInstructions"],
} as const;

export const COACH_RESPONSE_SCHEMA_GEMINI = geminifySchema(COACH_JSON_SCHEMA);

// ── Request validation (server-side, F17) ─────────────────────────────────────

import { AUTHOR_IDS } from "./types.ts";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS, ITERATIONS } from "./constants.ts";

const authorEnum = z.enum(AUTHOR_IDS);
const inputText = z.string().min(MIN_INPUT_CHARS).max(MAX_INPUT_CHARS);

export const writerRequestSchema = z.object({
  originalText: inputText,
  currentText: z.string().min(1).max(MAX_INPUT_CHARS * 2),
  author: authorEnum,
  instructions: z.array(z.string().max(MAX_INSTRUCTION_LEN)).max(MAX_INSTRUCTIONS),
  iterationNumber: z.number().int().min(1).max(ITERATIONS),
});

export const coachRequestSchema = z.object({
  originalText: inputText,
  draft: z.string().min(1).max(MAX_INPUT_CHARS * 2),
  prevDraft: z.string().max(MAX_INPUT_CHARS * 2).nullable(),
  prevScores: z
    .object({
      voiceMatch: scoreInt,
      diction: scoreInt,
      tone: scoreInt,
      fidelity: scoreInt,
      overall: scoreInt,
    })
    .nullable(),
  author: authorEnum,
  metrics: z.object({
    wordCount: z.number().int().min(0),
    sentenceCount: z.number().int().min(0),
    avgSentenceLen: z.number().min(0),
    adverbCount: z.number().int().min(0),
    hedgeCount: z.number().int().min(0),
  }),
});
