# StyleCraft

**Rewrite your words in a master's voice — and watch the writing climb toward it, one revision at a time.**

StyleCraft demonstrates *evaluation-driven iterative improvement* (hill climbing) with two cloud models:

- **Writer** — a small, fast model (`gemini-2.5-flash-lite`). Rewrites your text in a chosen public-domain author's voice. **The same model runs every iteration; its weights never change.**
- **Coach** — a stronger model (`gemini-2.5-pro`). Scores how close the rewrite came to that voice and returns concrete instructions for the next pass. **It never rewrites.**

Across 5 fixed iterations, the Coach's feedback accumulates into the instructions handed to the fixed Writer, and the author-match score climbs (`45 → 61 → 72 → 80 → 87`). Nothing is retrained — the system improves purely by feeding better instructions to the same weak model. That's the hill climb.

> **Not a privacy tool.** Your text is sent to the cloud for both rewriting and scoring. StyleCraft says so plainly in the UI and stores nothing after the session.

## How the hill climb works

The Writer's weights never change — the same small model runs all five passes. What changes is the **instruction set** the Coach hands it. Iteration 1 is deliberately *author-blind* (a plain clarity rewrite), so the voice-match score starts low and has real room to climb. From iteration 2 the Coach's specific, consolidated feedback ("shorter declaratives", "cut the hedge", "concrete nouns") steers the fixed Writer closer to the target voice each pass. Scores can dip — that's honest hill climbing — and the best iteration (not necessarily the last) is chosen as the winner.

See [`plan.md`](./plan.md) for the full architecture and build sequence.

## Architecture (short)

- **Vite + React + TypeScript** single-page app (no framework SSR needed).
- **Express API** (`server/`, port 3005) with two routes — `/writer` and `/coach` — that call Vertex AI via **Application Default Credentials (no API key)**.
- A **sample gallery** of pre-generated real runs replays instantly with zero cloud calls; "Try your own text" runs the live loop.
- A fully **mocked mode** (`STYLECRAFT_MOCK=1`) runs the entire UI with no GCP project or key.

## Develop

```bash
npm install
cp .env.example .env         # defaults are fine; set STYLECRAFT_MOCK=1 to run without GCP
npm run dev                  # Vite (web) + Express API together
```

- Web: http://localhost:5173
- API health: http://localhost:5173/stylecraft/api/health (proxied to :3005)

Real Vertex calls need a GCP project and `gcloud auth application-default login`; otherwise use mock mode.

## Test

```bash
npm test
```

## Browser requirements

None special — everything runs server-side. Any modern browser works, including mobile.

## License

MIT — see [`LICENSE`](./LICENSE).
