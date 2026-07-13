import type { LiveCard } from "../lib/cards.ts";

// The climb, e.g. 44 → 66 → 82 → 87 → 91, with a ▼ marker on regressions and
// the winning iteration emphasized.
export function ScoreProgression({
  cards,
  winnerIndex,
}: {
  cards: LiveCard[];
  winnerIndex: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 tnum text-sm">
      {cards.map((c, i) => {
        const isWinner = i === winnerIndex;
        const val =
          c.status === "scored" && c.scores
            ? String(c.scores.overall)
            : c.status === "failed"
              ? "×"
              : "…";
        return (
          <span key={c.iterationNumber} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-hair">→</span>}
            <span
              className={
                isWinner
                  ? "font-semibold text-accent"
                  : c.status === "failed"
                    ? "text-bad"
                    : "text-ink"
              }
            >
              {val}
              {c.regressed && <span className="text-bad" aria-label="regressed"> ▼</span>}
            </span>
          </span>
        );
      })}
    </div>
  );
}
