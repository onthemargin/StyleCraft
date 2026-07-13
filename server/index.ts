import express from "express";
import type { Request, Response } from "express";
import { writerRequestSchema, coachRequestSchema } from "../src/shared/schema.ts";
import { mockWriterRewrite } from "../src/shared/mock/writer.ts";
import { mockCoachEvaluate } from "../src/shared/mock/coach.ts";
import { apiLimiter } from "./rate-limit.ts";
import { tryConsumeBudget } from "./budget.ts";
import { getClients, runWriter, runCoach } from "./services.ts";

const PORT = Number(process.env.PORT ?? 3005);
const API_BASE = process.env.STYLECRAFT_API_BASE ?? "/stylecraft/api";
const MOCK = process.env.STYLECRAFT_MOCK === "1";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // behind nginx / Cloud Run — trust X-Forwarded-For
app.use(express.json({ limit: "16kb" }));

const router = express.Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "stylecraft-api",
    mock: MOCK,
    writerModel: process.env.WRITER_MODEL ?? "gemini-2.5-flash-lite",
    coachModel: process.env.COACH_MODEL ?? "gemini-2.5-pro",
  });
});

function budgetOk(res: Response): boolean {
  if (MOCK) return true;
  if (tryConsumeBudget()) return true;
  res.status(503).json({ error: "Daily capacity reached. Please try again tomorrow." });
  return false;
}

/**
 * Log the real (possibly infra-revealing) detail server-side; return a generic
 * message to the client. Upstream Vertex errors can embed the project id and
 * internal resource paths — those must never reach the browser.
 */
function failSafely(res: Response, status: number, clientMsg: string, detail: unknown): void {
  console.error(
    JSON.stringify({
      msg: "stylecraft-upstream-error",
      status,
      detail: detail instanceof Error ? detail.message : String(detail),
    }),
  );
  res.status(status).json({ error: clientMsg });
}

// ── Writer ────────────────────────────────────────────────────────────────────
router.post("/writer", apiLimiter, async (req: Request, res: Response) => {
  const parsed = writerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Invalid request: ${parsed.error.issues[0]?.message}` });
    return;
  }
  if (!budgetOk(res)) return;
  try {
    const text = MOCK
      ? mockWriterRewrite(parsed.data)
      : await runWriter(parsed.data, (await getClients()).writer);
    res.json({ text });
  } catch (err) {
    failSafely(res, 502, "The rewriting service is temporarily unavailable.", err);
  }
});

// ── Coach ─────────────────────────────────────────────────────────────────────
router.post("/coach", apiLimiter, async (req: Request, res: Response) => {
  const parsed = coachRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Invalid request: ${parsed.error.issues[0]?.message}` });
    return;
  }
  if (!budgetOk(res)) return;
  try {
    const result = MOCK
      ? ({ ok: true, ...mockCoachEvaluate(parsed.data) } as const)
      : await runCoach(parsed.data, (await getClients()).coach);
    if (!result.ok) {
      failSafely(res, 502, "The Coach couldn't score this draft.", result.error);
      return;
    }
    const { ok: _ok, ...payload } = result;
    res.json(payload);
  } catch (err) {
    failSafely(res, 502, "The scoring service is temporarily unavailable.", err);
  }
});

app.use(API_BASE, router);

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  app.listen(PORT, () => {
    console.log(
      JSON.stringify({ msg: "stylecraft-api listening", port: PORT, base: API_BASE, mock: MOCK }),
    );
  });
}

export { app };
