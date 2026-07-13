import type {
  CoachRequest,
  CoachResponse,
  WriterRequest,
} from "../shared/types.ts";
import type { WriterFn, CoachFn } from "../shared/orchestrator.ts";

// Matches the server mount + the Vite dev proxy. Override with VITE_API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE ?? "/stylecraft/api";

const WRITER_TIMEOUT_MS = 30_000;
const COACH_TIMEOUT_MS = 45_000;

export class RateLimitedError extends Error {
  constructor(public retryAfter?: number) {
    super("You've made a lot of requests — please wait a moment and try again.");
    this.name = "RateLimitedError";
  }
}

async function postJSON<T>(
  path: string,
  body: unknown,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ status: number; body: T }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const parsed = (await res.json().catch(() => ({}))) as T;
    return { status: res.status, body: parsed };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Writer client — throws on any failure (a failed rewrite aborts the run). */
export const writerClient: WriterFn = async (req: WriterRequest) => {
  const t = performance.now();
  const { status, body } = await postJSON<{ text?: string; error?: string; retryAfter?: number }>(
    "/writer",
    req,
    WRITER_TIMEOUT_MS,
  );
  const ms = Math.round(performance.now() - t);
  if (status === 429) throw new RateLimitedError(body.retryAfter);
  if (status !== 200 || typeof body.text !== "string") {
    throw new Error(body.error ?? `Writer failed (${status})`);
  }
  return { text: body.text, ms };
};

/**
 * Coach client — returns ok:false for a scoring failure (502) so the loop can
 * continue; throws for fatal statuses (429 rate limit, 503 budget, 400 bug).
 */
export const coachClient: CoachFn = async (req: CoachRequest) => {
  const t = performance.now();
  const { status, body } = await postJSON<
    CoachResponse & { error?: string; retryAfter?: number }
  >("/coach", req, COACH_TIMEOUT_MS);
  const ms = Math.round(performance.now() - t);
  if (status === 200 && body.scores) {
    return { result: { ok: true, ...body }, ms };
  }
  if (status === 429) throw new RateLimitedError(body.retryAfter);
  if (status === 503) throw new Error(body.error ?? "Daily capacity reached.");
  if (status === 400) throw new Error(body.error ?? "Bad coach request.");
  // 502 or anything else → treat as a (recoverable) scoring failure.
  return { result: { ok: false, error: body.error ?? "Scoring failed." }, ms };
};
