import { useState } from "react";
import type { LiveCard } from "../lib/cards.ts";
import type { TextMetrics } from "../shared/types.ts";
import { DiffText } from "./DiffText.tsx";
import { ScorePanel } from "./ScorePanel.tsx";

function MetricLine({ m }: { m: TextMetrics }) {
  return (
    <p className="tnum text-[11px] text-muted">
      {m.wordCount} words · {m.sentenceCount} sentence{m.sentenceCount === 1 ? "" : "s"} ·
      avg {m.avgSentenceLen} · {m.hedgeCount} hedge{m.hedgeCount === 1 ? "" : "s"} ·{" "}
      {m.adverbCount} adverb{m.adverbCount === 1 ? "" : "s"}
    </p>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IterationCard({
  card,
  isWinner,
}: {
  card: LiveCard;
  isWinner: boolean;
}) {
  // Collapsed by default — the chart shows the climb; this is the drill-down.
  const [open, setOpen] = useState(false);
  const scored = card.status === "scored" && card.scores;
  const bodyId = `iter-${card.iterationNumber}-body`;

  return (
    <article
      className={`overflow-hidden rounded-md border bg-white/40 ${
        isWinner ? "border-accent/50" : "border-hair"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <Chevron open={open} />
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs">
          <span className="tnum font-medium text-ink">Iteration {card.iterationNumber}</span>
          {card.regressed && <span className="text-bad">▼ regressed</span>}
          {isWinner && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              winner
            </span>
          )}
          {!open && (
            <span className="reading truncate text-[13px] text-muted">
              {card.outputText}
            </span>
          )}
        </div>
        <span className="tnum shrink-0 text-sm">
          {scored ? (
            <span className="font-semibold text-ink">match {card.scores!.overall}</span>
          ) : card.status === "failed" ? (
            <span className="text-bad">scoring failed</span>
          ) : (
            <span className="text-muted">scoring…</span>
          )}
        </span>
      </button>

      {open && (
        <div id={bodyId} className="grid gap-4 border-t border-hair p-4 sm:grid-cols-[1.3fr_1fr]">
          {/* Writer — input → updated */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              Writer · Flash-Lite
            </span>
            <DiffText
              before={card.inputText}
              after={card.outputText}
              className="reading text-[17px] leading-relaxed text-ink"
            />
            <MetricLine m={card.metrics} />
          </div>

          {/* Coach — scores + critique */}
          <div className="flex flex-col gap-3 sm:border-l sm:border-hair sm:pl-4">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              Coach · Pro
            </span>
            {scored ? (
              <>
                <ScorePanel scores={card.scores!} />
                {card.critique.length > 0 && (
                  <ul className="flex flex-col gap-1.5 text-[13px] text-muted">
                    {card.critique.map((c, i) => (
                      <li key={i}>
                        {c.span && <span className="text-ink">“{c.span}” — </span>}
                        {c.comment}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : card.status === "failed" ? (
              <p className="text-[13px] text-muted">
                The Coach couldn’t score this draft. The run continued with the
                previous feedback.
              </p>
            ) : (
              <p className="text-[13px] text-muted" aria-live="polite">
                Evaluating…
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
