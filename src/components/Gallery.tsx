import { useEffect, useState } from "react";
import { AUTHORS } from "../shared/authors.ts";
import { loadSampleIndex, type SampleMeta } from "../lib/samples.ts";

// Grid of example runs. Selecting one hands the id up to the app, which loads
// and replays it in the shared run area.
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
        <h2 className="text-base font-medium text-ink">Or watch an example climb</h2>
        <p className="text-[14px] text-muted">
          Real runs, generated ahead of time — pick one to replay it, step by step.
        </p>
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {index?.map((s) => {
          const selected = s.id === selectedId;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(s.id)}
                aria-pressed={selected}
                className={`group flex h-full w-full flex-col gap-1 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${
                  selected
                    ? "border-accent bg-accent/[0.06]"
                    : "border-hair bg-white/40 hover:border-accent/50"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted">
                  {AUTHORS[s.author].label}
                </span>
                <span className="reading text-[16px] leading-snug text-ink group-hover:text-accent">
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
