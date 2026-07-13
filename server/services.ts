// Server-side Vertex services (real calls only — mock is chosen in index.ts).
// Ported request-body shape from onframe/clawnicle generateContent usage.

import { createVertexClient, resolveProject, type VertexClient } from "./vertex.ts";
import { buildWriterPrompt, buildCoachPrompt } from "../src/shared/prompts.ts";
import { parseCoachOutput } from "../src/shared/coach-parse.ts";
import { getAuthor } from "../src/shared/authors.ts";
import { COACH_RESPONSE_SCHEMA_GEMINI } from "../src/shared/schema.ts";
import type {
  CoachRequest,
  CoachResult,
  WriterRequest,
} from "../src/shared/types.ts";

const LOCATION = process.env.VERTEX_LOCATION ?? "us-central1";
const WRITER_MODEL = process.env.WRITER_MODEL ?? "gemini-2.5-flash-lite";
const COACH_MODEL = process.env.COACH_MODEL ?? "gemini-2.5-pro";

let clientsPromise: Promise<{ writer: VertexClient; coach: VertexClient }> | null =
  null;

/** Lazily resolve project via ADC and memoize both model clients. */
export function getClients() {
  if (!clientsPromise) {
    clientsPromise = (async () => {
      const project = await resolveProject();
      return {
        writer: createVertexClient({ project, location: LOCATION, model: WRITER_MODEL }),
        coach: createVertexClient({ project, location: LOCATION, model: COACH_MODEL }),
      };
    })().catch((err) => {
      clientsPromise = null; // allow retry on a later request
      throw err;
    });
  }
  return clientsPromise;
}

function part(text: string) {
  return { parts: [{ text }] };
}

/** Real Writer: weak model, a little warmth, short output. */
export async function runWriter(
  req: WriterRequest,
  client: VertexClient,
): Promise<string> {
  const { system, user } = buildWriterPrompt(req, getAuthor(req.author).label);
  const { text } = await client.generate({
    systemInstruction: part(system),
    contents: [{ role: "user", ...part(user) }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 512,
    },
  });
  return text.trim();
}

/**
 * Real Coach: strong model, temperature 0, thinking capped for latency,
 * structured JSON via responseSchema. Returns a CoachResult (never throws for a
 * scoring/parse failure — carries ok:false so the loop can continue, F18).
 */
export async function runCoach(
  req: CoachRequest,
  client: VertexClient,
): Promise<CoachResult> {
  const { system, user } = buildCoachPrompt(req, getAuthor(req.author));
  let raw: string;
  try {
    const res = await client.generate({
      systemInstruction: part(system),
      contents: [{ role: "user", ...part(user) }],
      generationConfig: {
        temperature: 0,
        // Roomy enough that verbose critique + a low thinking budget never
        // truncate the JSON (truncation = a scoring failure, seen in the spike).
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: COACH_RESPONSE_SCHEMA_GEMINI,
        // Cap Gemini 2.5 Pro "thinking" low (Pro rejects 0) to keep latency down.
        thinkingConfig: { thinkingBudget: 128 },
      },
    });
    raw = res.text;
  } catch (err) {
    return {
      ok: false,
      error: `Coach request failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  const parsed = parseCoachOutput(raw, req.draft);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, ...parsed.data };
}
