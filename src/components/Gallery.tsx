import { useEffect, useState } from "react";
import type { SampleRun } from "../shared/types.ts";
import { AUTHORS } from "../shared/authors.ts";
import { loadSampleIndex, loadSample, type SampleMeta } from "../lib/samples.ts";
import { iterationToCard } from "../lib/cards.ts";
import { RunView } from "./RunView.tsx";

export function Gallery({ onTryYourOwn }: { onTryYourOwn: () => void }) {
  const [index, setIndex] = useState<SampleMeta[] | null>(null);
  const [selected, setSelected] = useState<SampleRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSampleIndex().then(setIndex).catch(() => setError("Could not load examples."));
  }, []);

  if (selected) {
    const cards = selected.iterations.map(iterationToCard);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="self-start text-sm text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        >
          ← All examples
        </button>
        <p className="text-[15px] leading-relaxed text-muted">
          <span className="text-ink">Original.</span> {selected.originalText}
        </p>
        <RunView
          original={selected.originalText}
          authorLabel={AUTHORS[selected.author].label}
          cards={cards}
          winnerIndex={selected.winnerIndex}
          showFinal
          note="pre-generated example"
          onReset={() => setSelected(null)}
          onTryAnother={onTryYourOwn}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-ink">Watch a climb</h2>
        <p className="text-[13px] text-muted">
          Real runs, generated ahead of time. Pick one to replay it instantly —
          or{" "}
          <button
            type="button"
            onClick={onTryYourOwn}
            className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
          >
            try your own text
          </button>
          .
        </p>
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      <ul className="grid gap-2 sm:grid-cols-2">
        {index?.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() =>
                loadSample(s.id).then(setSelected).catch(() => setError("Could not load that example."))
              }
              className="group flex w-full flex-col gap-1 rounded-md border border-hair bg-white/40 p-4 text-left transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="text-[10px] uppercase tracking-widest text-muted">
                {AUTHORS[s.author].label}
              </span>
              <span className="text-[15px] leading-snug text-ink group-hover:text-accent">
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
