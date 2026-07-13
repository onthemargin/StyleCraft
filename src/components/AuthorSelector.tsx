import type { AuthorTarget } from "../shared/types.ts";
import { AUTHORS } from "../shared/authors.ts";
import { AUTHOR_IDS } from "../shared/types.ts";

export function AuthorSelector({
  value,
  onChange,
  disabled,
}: {
  value: AuthorTarget;
  onChange: (a: AuthorTarget) => void;
  disabled?: boolean;
}) {
  const active = AUTHORS[value];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-widest text-muted">
        Write in the voice of
      </span>
      <div role="radiogroup" aria-label="Target author" className="flex flex-wrap gap-1.5">
        {AUTHOR_IDS.map((id) => {
          const selected = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-hair text-ink hover:border-accent/50"
              }`}
            >
              {AUTHORS[id].label.split(" ").slice(-1)[0]}
            </button>
          );
        })}
      </div>
      <p className="text-[13px] leading-relaxed text-muted">
        <span className="text-ink">{active.label}</span>{" "}
        <span className="text-muted">({active.era})</span> — {active.description}
      </p>
    </div>
  );
}
