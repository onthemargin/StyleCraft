import { useState } from "react";
import type { LiveCard } from "../lib/cards.ts";
import { computeMetrics } from "../shared/text-metrics.ts";
import { reachedTarget } from "../shared/scoring.ts";

function CopyIcon({ done }: { done: boolean }) {
  return done ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15V5a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyFinal({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copy final text"
      aria-label={done ? "Copied" : "Copy final text"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={`rounded-md p-1 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        done ? "text-accent" : "text-muted hover:text-accent"
      }`}
    >
      <CopyIcon done={done} />
    </button>
  );
}

function Delta({ label, from, to }: { label: string; from: number; to: number }) {
  const changed = to !== from;
  return (
    <span className="tnum whitespace-nowrap text-xs text-muted">
      {label} <span className="text-ink">{from}</span>
      <span className="mx-1">→</span>
      <span className={changed ? "text-accent" : "text-ink"}>{to}</span>
    </span>
  );
}

export function FinalPanel({
  original,
  authorLabel,
  winner,
}: {
  original: string;
  authorLabel: string;
  winner: LiveCard;
}) {
  const om = computeMetrics(original);
  const fm = winner.metrics;
  const score = winner.scores?.overall ?? 0;

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/[0.055] p-5 sm:p-6"
      aria-label="Final result"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium tracking-tight text-ink">
          {authorLabel} match <span className="tnum text-accent">{score}</span>
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
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-accent">Final</span>
            <CopyFinal text={winner.outputText} />
          </div>
          <p className="reading text-[18px] leading-relaxed text-ink">{winner.outputText}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-hair pt-3">
        <Delta label="words" from={om.wordCount} to={fm.wordCount} />
        <Delta label="avg sentence" from={om.avgSentenceLen} to={fm.avgSentenceLen} />
        <Delta label="hedges" from={om.hedgeCount} to={fm.hedgeCount} />
        <Delta label="adverbs" from={om.adverbCount} to={fm.adverbCount} />
      </div>
    </section>
  );
}
