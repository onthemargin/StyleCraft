import { useEffect, useRef } from "react";
import type { LiveCard } from "../lib/cards.ts";
import { ScoreProgression } from "./ScoreProgression.tsx";
import { IterationCard } from "./IterationCard.tsx";
import { FinalPanel } from "./FinalPanel.tsx";

// Shared renderer for a run — used by both live mode and gallery replay.
// Cards stack newest-first (reverse-chronological); the Final panel is pinned
// on top when the run is complete.
export function RunView({
  original,
  authorLabel,
  cards,
  winnerIndex,
  showFinal,
  note,
  onReset,
  onTryAnother,
}: {
  original: string;
  authorLabel: string;
  cards: LiveCard[];
  winnerIndex: number;
  showFinal: boolean;
  note?: string;
  onReset: () => void;
  onTryAnother: () => void;
}) {
  const finalRef = useRef<HTMLDivElement>(null);
  const winner = winnerIndex >= 0 ? cards[winnerIndex] : null;

  useEffect(() => {
    if (showFinal && winner) finalRef.current?.focus();
  }, [showFinal, winner]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-muted">
            {authorLabel} match
          </span>
          <ScoreProgression cards={cards} winnerIndex={winnerIndex} />
        </div>
        {note && (
          <span className="rounded-full border border-hair px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {note}
          </span>
        )}
      </div>

      {showFinal && winner && (
        <div ref={finalRef} tabIndex={-1} className="outline-none">
          <FinalPanel
            original={original}
            authorLabel={authorLabel}
            winner={winner}
            cards={cards}
            onReset={onReset}
            onTryAnother={onTryAnother}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {[...cards].reverse().map((card, i) => {
          const realIndex = cards.length - 1 - i;
          return (
            <IterationCard
              key={card.iterationNumber}
              card={card}
              isWinner={realIndex === winnerIndex}
            />
          );
        })}
      </div>
    </div>
  );
}
