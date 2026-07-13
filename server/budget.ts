import type { Request, Response, NextFunction } from "express";

// Per-instance daily Vertex-call budget guard (F20). Coarse abuse ceiling on
// top of the rate limiter; also logs call volume so abuse is visible. Counts
// real cloud calls only — the caller skips this in mock mode.

const DAILY_MAX = Number(process.env.VERTEX_DAILY_MAX ?? 4000);

let day = "";
let count = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Reserve one call against today's budget. Returns false if exhausted. */
export function tryConsumeBudget(): boolean {
  const d = today();
  if (d !== day) {
    day = d;
    count = 0;
  }
  if (count >= DAILY_MAX) return false;
  count++;
  if (count % 100 === 0) {
    console.log(JSON.stringify({ msg: "vertex-budget", day, count, max: DAILY_MAX }));
  }
  return true;
}

/** Express middleware form for real-mode routes. */
export function budgetGuard(_req: Request, res: Response, next: NextFunction) {
  if (!tryConsumeBudget()) {
    res.status(503).json({
      error: "Daily capacity reached. Please try again tomorrow.",
    });
    return;
  }
  next();
}
