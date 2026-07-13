import { useState } from "react";
import type { LiveCard } from "../lib/cards.ts";
import { computeMetrics } from "../shared/text-metrics.ts";
import { reachedTarget } from "../shared/scoring.ts";
import { DiffText } from "./DiffText.tsx";

function CopyButton({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="rounded-md border border-hair px-3 py-1.5 text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      {done ? "Copied" : label}
    </button>
  );
}

function Delta({ label, from, to }: { label: string; from: number; to: number }) {
  const better = to !== from;
  return (
    <span className="tnum whitespace-nowrap text-xs text-muted">
      {label} <span className="text-ink">{from}</span>
      <span className="mx-1">→</span>
      <span className={better ? "text-accent" : "text-ink"}>{to}</span>
    </span>
  );
}

export function FinalPanel({
  original,
  authorLabel,
  winner,
  cards,
  onReset,
  onTryAnother,
}: {
  original: string;
  authorLabel: string;
  winner: LiveCard;
  cards: LiveCard[];
  onReset: () => void;
  onTryAnother: () => void;
}) {
  const om = computeMetrics(original);
  const fm = winner.metrics;
  const score = winner.scores?.overall ?? 0;

  const transcript = [
    `StyleCraft — ${authorLabel}`,
    `Original: ${original}`,
    "",
    ...cards.map(
      (c) =>
        `Iteration ${c.iterationNumber}${
          c.scores ? ` (match ${c.scores.overall})` : " (scoring failed)"
        }: ${c.outputText}`,
    ),
    "",
    `Final (iteration ${winner.iterationNumber}): ${winner.outputText}`,
  ].join("\n");

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/[0.055] p-5 sm:p-6"
      aria-label="Final result"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium tracking-tight text-ink">
          {authorLabel} match{" "}
          <span className="tnum text-accent">{score}</span>
          <span className="text-muted"> · winner: iteration {winner.iterationNumber}</span>
        </h2>
        {reachedTarget(score) && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            target voice reached
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-lg border border-hair bg-paper/70 p-4">
          <span className="text-[10px] uppercase tracking-widest text-muted">Original</span>
          <p className="reading text-[18px] leading-relaxed text-muted">{original}</p>
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg border border-accent/30 bg-white p-4">
          <span className="text-[10px] uppercase tracking-widest text-accent">Final</span>
          <DiffText
            before={original}
            after={winner.outputText}
            className="reading text-[18px] leading-relaxed text-ink"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-hair pt-3">
        <Delta label="words" from={om.wordCount} to={fm.wordCount} />
        <Delta label="avg sentence" from={om.avgSentenceLen} to={fm.avgSentenceLen} />
        <Delta label="hedges" from={om.hedgeCount} to={fm.hedgeCount} />
        <Delta label="adverbs" from={om.adverbCount} to={fm.adverbCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton label="Copy final" text={winner.outputText} />
        <CopyButton label="Copy all iterations" text={transcript} />
        <button
          type="button"
          onClick={onTryAnother}
          className="rounded-md border border-hair px-3 py-1.5 text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          Try another author
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-hair px-3 py-1.5 text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          Start over
        </button>
      </div>
    </section>
  );
}
