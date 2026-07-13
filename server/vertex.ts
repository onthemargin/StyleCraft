// Node-only Vertex AI client. Ported from onframe/web-server/vertex.js and
// clawnicle/forge/vertex.js: ADC auth (no API key), generateContent REST,
// text extraction, and the two real-world Gemini output quirks (code fences,
// "+"-signed integers). NEVER import this into the browser bundle.

import { GoogleAuth } from "google-auth-library";

export { stripCodeFences, stripPlusSignedIntegers } from "../src/shared/json-repair.ts";

const VERTEX_TIMEOUT_MS = 30_000;

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

export function extractContent(payload: GenerateContentResponse): string {
  const candidates = payload?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Vertex response missing candidates");
  }
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error("Vertex response missing content parts");
  }
  const text = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
  if (!text.trim()) throw new Error("Vertex response missing text content");
  return text;
}

export type AccessTokenFn = () => Promise<string>;

async function defaultGetAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token =
    typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;
  if (!token) throw new Error("Failed to obtain Vertex AI access token");
  return token;
}

export interface VertexResult {
  text: string;
  finishReason: string | null;
}

export interface VertexClientOptions {
  project: string;
  location: string;
  model: string;
  getAccessToken?: AccessTokenFn;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** A thin generateContent client. Callers build the request body
 *  (contents / systemInstruction / generationConfig). */
export function createVertexClient({
  project,
  location,
  model,
  getAccessToken = defaultGetAccessToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = VERTEX_TIMEOUT_MS,
}: VertexClientOptions) {
  if (!project) throw new Error("createVertexClient: project is required");
  if (!location) throw new Error("createVertexClient: location is required");
  if (!model) throw new Error("createVertexClient: model is required");

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

  async function generate(body: unknown): Promise<VertexResult> {
    const token = await getAccessToken();
    if (!token) throw new Error("missing access token");

    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new Error(
        `Vertex request failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }

    if (!response.ok) {
      let snippet = "";
      try {
        snippet = (await response.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
      throw new Error(`Vertex returned status ${response.status} ${snippet}`.trim());
    }

    const payload = (await response.json()) as GenerateContentResponse;
    const finishReason = payload?.candidates?.[0]?.finishReason ?? null;
    return { text: extractContent(payload), finishReason };
  }

  return { generate, model, url };
}

export type VertexClient = ReturnType<typeof createVertexClient>;

/** Resolve the GCP project from env or ADC (Cloud Run / gcloud ADC). */
export async function resolveProject(): Promise<string> {
  if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const project = await auth.getProjectId();
  if (!project) throw new Error("Could not resolve GCP project (set GCP_PROJECT)");
  return project;
}
