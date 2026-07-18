import { useEffect, useState } from "react";
import { AUTHORS } from "../shared/authors.ts";
import { loadSampleIndex, type SampleMeta } from "../lib/samples.ts";

// Compact list of example runs, shown beside the input so a first-time visitor
// can watch a real climb before writing anything. Selecting one hands the id up
// to the app, which loads and replays it in the shared run area.
export function Gallery({
  onSelect,
  selectedId,
  disabled,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
  disabled?: boolean;
}) {
  const [index, setIndex] = useState<SampleMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSampleIndex().then(setIndex).catch(() => setError("Could not load examples."));
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-[11px] uppercase tracking-widest text-muted">
          Or watch a real example
        </h2>
        <p className="text-[13px] text-muted">
          Pre-generated runs — pick one to replay it, step by step.
        </p>
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      <ul className="flex flex-col gap-2">
        {index?.map((s) => {
          const selected = s.id === selectedId;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(s.id)}
                aria-pressed={selected}
                className={`group flex w-full items-baseline gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${
                  selected
                    ? "border-accent bg-accent/[0.06]"
                    : "border-hair bg-white/40 hover:border-accent/50"
                }`}
              >
                <span className="w-20 shrink-0 text-[10px] uppercase tracking-widest text-muted">
                  {AUTHORS[s.author].label}
                </span>
                <span className="reading min-w-0 flex-1 text-[15px] leading-snug text-ink group-hover:text-accent">
                  {s.label}
                </span>
                <span className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
