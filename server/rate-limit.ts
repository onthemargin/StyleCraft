import rateLimit from "express-rate-limit";

// Shared per-IP limiter across BOTH routes (F2). One run = up to 5 Writer +
// 5 Coach calls, so 30 requests / 15 min ≈ 3 full runs per IP per window.
// In-memory → resets on instance cycle: a speed bump, not the real control.
// Edge rate-limiting (Cloud Armor) is the production limiter — see README.

const WINDOW_MS = 15 * 60 * 1000;
const MAX = Number(process.env.STYLECRAFT_RATE_MAX ?? 30);

export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests — please wait a moment before trying again.",
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    });
  },
});
