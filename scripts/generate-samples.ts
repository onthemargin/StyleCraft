// Premise spike + sample generator. Runs the REAL 5-iteration Vertex loop on
// this VM (ADC) and prints score curves + per-call latency. With --one it does
// a single demo run (the go/no-go spike); otherwise it runs the curated set and
// writes clean runs to public/samples/*.json for the gallery.
//
//   npx tsx scripts/generate-samples.ts --one     # single spike run
//   npx tsx scripts/generate-samples.ts           # full curated set

import { writeFile, mkdir } from "node:fs/promises";
import { runClimb, type WriterFn, type CoachFn } from "../src/shared/orchestrator.ts";
import { getClients, runWriter, runCoach } from "../server/services.ts";
import { AUTHORS } from "../src/shared/authors.ts";
import type { AuthorTarget, SampleRun } from "../src/shared/types.ts";

interface SamplePair {
  id: string;
  label: string;
  author: AuthorTarget;
  text: string;
}

const CURATED: SamplePair[] = [
  {
    id: "meeting-hemingway",
    label: "A vague work update, in Hemingway's voice",
    author: "hemingway",
    text: "The meeting was good and we discussed many things that will probably help us in the future.",
  },
  {
    id: "product-orwell",
    label: "Corporate jargon, cleared by Orwell",
    author: "orwell",
    text: "We are leveraging synergies to facilitate the optimization of our core deliverables going forward.",
  },
  {
    id: "trip-twain",
    label: "A flat travel note, told by Twain",
    author: "twain",
    text: "The trip was nice and we saw some interesting things and the food was pretty good overall.",
  },
  {
    id: "invite-austen",
    label: "A blunt invitation, refined by Austen",
    author: "austen",
    text: "You should come to dinner on Friday. It will be fun and there will be a lot of people there.",
  },
  {
    id: "advice-franklin",
    label: "Rambling advice, sharpened by Franklin",
    author: "franklin",
    text: "I think it is usually a pretty good idea to try to save at least a little bit of money when you can.",
  },
  {
    id: "review-wilde",
    label: "A dull opinion, sharpened by Wilde",
    author: "wilde",
    text: "The party was fine but honestly it went on for a bit too long and was somewhat boring in places.",
  },
];

async function main() {
  const one = process.argv.includes("--one");
  const clients = await getClients();

  const writer: WriterFn = async (req) => {
    const t = Date.now();
    const text = await runWriter(req, clients.writer);
    return { text, ms: Date.now() - t };
  };
  const coach: CoachFn = async (req) => {
    const t = Date.now();
    const result = await runCoach(req, clients.coach);
    return { result, ms: Date.now() - t };
  };

  const pairs = one ? CURATED.slice(0, 1) : CURATED;
  const runs: SampleRun[] = [];

  for (const pair of pairs) {
    console.log(`\n━━━ ${pair.label}  [${AUTHORS[pair.author].label}] ━━━`);
    console.log(`original: ${pair.text}\n`);
    const t0 = Date.now();
    const climb = await runClimb({
      originalText: pair.text,
      author: pair.author,
      writer,
      coach,
    });
    const totalMs = Date.now() - t0;

    for (const it of climb.iterations) {
      const s = it.scores;
      const tag = it.regressed ? " ▼" : "";
      const scoreStr = s
        ? `overall ${String(s.overall).padStart(3)}${tag}  (voice ${s.voiceMatch} diction ${s.diction} tone ${s.tone} fidelity ${s.fidelity})`
        : "SCORING FAILED";
      console.log(
        `  ${it.iterationNumber}. ${scoreStr}  [w ${it.writerMs}ms / c ${it.coachMs}ms]`,
      );
      console.log(`     ${it.outputText}`);
    }
    const curve = climb.iterations.map((i) => (i.scores ? i.scores.overall : "×")).join(" → ");
    console.log(`  curve: ${curve}   winner: iteration ${climb.winnerIndex + 1}   total ${(totalMs / 1000).toFixed(1)}s`);

    runs.push({
      id: pair.id,
      label: pair.label,
      author: pair.author,
      originalText: pair.text,
      iterations: climb.iterations,
      winnerIndex: climb.winnerIndex,
      generatedAt: new Date().toISOString(),
      simulated: false,
    });
  }

  if (!one) {
    await mkdir("public/samples", { recursive: true });
    for (const run of runs) {
      await writeFile(`public/samples/${run.id}.json`, JSON.stringify(run, null, 2));
    }
    await writeFile(
      "public/samples/index.json",
      JSON.stringify(
        runs.map((r) => ({ id: r.id, label: r.label, author: r.author })),
        null,
        2,
      ),
    );
    console.log(`\nWrote ${runs.length} sample(s) to public/samples/`);
  }
}

main().catch((err) => {
  console.error("spike failed:", err);
  process.exit(1);
});
