import { useEffect, useRef } from "react";
import type { LiveCard } from "../lib/cards.ts";
import { ClimbChart } from "./ClimbChart.tsx";
import { IterationCard } from "./IterationCard.tsx";
import { FinalPanel } from "./FinalPanel.tsx";

// Shared renderer for a run — used by both live mode and gallery replay.
// The climb chart sits on top and grows as iterations score; the Final panel
// pins above the reverse-chronological iteration history when the run completes.
export function RunView({
  original,
  authorLabel,
  cards,
  winnerIndex,
  showFinal,
  note,
}: {
  original: string;
  authorLabel: string;
  cards: LiveCard[];
  winnerIndex: number;
  showFinal: boolean;
  note?: string;
}) {
  const finalRef = useRef<HTMLDivElement>(null);
  const winner = winnerIndex >= 0 ? cards[winnerIndex] : null;

  useEffect(() => {
    if (showFinal && winner) finalRef.current?.focus();
  }, [showFinal, winner]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-hair bg-white/40 px-4 pb-2 pt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-muted">
            {authorLabel} match — climbing
          </span>
          {note && (
            <span className="rounded-full border border-hair px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
              {note}
            </span>
          )}
        </div>
        <ClimbChart cards={cards} winnerIndex={winnerIndex} />
      </div>

      {showFinal && winner && (
        <div ref={finalRef} tabIndex={-1} className="outline-none">
          <FinalPanel original={original} authorLabel={authorLabel} winner={winner} />
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
