import request from "supertest";
import type { Express } from "express";
import { computeMetrics } from "../../src/shared/text-metrics.ts";

const BASE = "/stylecraft/api";
const ORIGINAL =
  "The meeting was good and we discussed many things that will probably help us in the future.";

let app: Express;

beforeAll(async () => {
  process.env.STYLECRAFT_MOCK = "1";
  ({ app } = await import("../index.ts"));
});

const writerBody = (over = {}) => ({
  originalText: ORIGINAL,
  currentText: ORIGINAL,
  author: "hemingway",
  instructions: [],
  iterationNumber: 1,
  ...over,
});

const coachBody = (draft = ORIGINAL, over = {}) => ({
  originalText: ORIGINAL,
  draft,
  prevDraft: null,
  prevScores: null,
  author: "hemingway",
  metrics: computeMetrics(draft),
  ...over,
});

describe("GET /health", () => {
  it("reports mock mode", async () => {
    const res = await request(app).get(`${BASE}/health`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mock).toBe(true);
  });
});

describe("POST /writer", () => {
  it("returns rewritten text (mock)", async () => {
    const res = await request(app).post(`${BASE}/writer`).send(writerBody());
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe("string");
    expect(res.body.text.length).toBeGreaterThan(0);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
  });

  it("400s on too-short text", async () => {
    const res = await request(app)
      .post(`${BASE}/writer`)
      .send(writerBody({ originalText: "hi" }));
    expect(res.status).toBe(400);
  });

  it("400s on an unknown author", async () => {
    const res = await request(app)
      .post(`${BASE}/writer`)
      .send(writerBody({ author: "shakespeare" }));
    expect(res.status).toBe(400);
  });

  it("400s on out-of-range iterationNumber", async () => {
    const res = await request(app)
      .post(`${BASE}/writer`)
      .send(writerBody({ iterationNumber: 99 }));
    expect(res.status).toBe(400);
  });
});

describe("POST /coach", () => {
  it("returns scores, critique, instructions (mock)", async () => {
    const res = await request(app).post(`${BASE}/coach`).send(coachBody());
    expect(res.status).toBe(200);
    expect(res.body.scores.overall).toBeGreaterThanOrEqual(0);
    expect(res.body.scores.overall).toBeLessThanOrEqual(100);
    expect(Array.isArray(res.body.critique)).toBe(true);
    expect(Array.isArray(res.body.nextInstructions)).toBe(true);
  });

  it("scores a tightened draft higher than the loose original", async () => {
    const loose = await request(app).post(`${BASE}/coach`).send(coachBody(ORIGINAL));
    const tight = await request(app)
      .post(`${BASE}/coach`)
      .send(coachBody("The meeting ran an hour. We made three decisions."));
    expect(tight.body.scores.overall).toBeGreaterThan(loose.body.scores.overall);
  });

  it("400s on a missing metrics field", async () => {
    const bad = coachBody();
    // @ts-expect-error intentionally break the shape
    delete bad.metrics;
    const res = await request(app).post(`${BASE}/coach`).send(bad);
    expect(res.status).toBe(400);
  });
});
