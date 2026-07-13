import { useMemo } from "react";
import { diffWords } from "../shared/diff.ts";

// Word-level diff rendered as elements (never dangerouslySetInnerHTML). Changes
// carry non-color cues too: additions are underlined, removals struck through.
export function DiffText({
  before,
  after,
  className = "",
}: {
  before: string;
  after: string;
  className?: string;
}) {
  const tokens = useMemo(() => diffWords(before, after), [before, after]);
  return (
    <p className={className}>
      {tokens.map((t, i) => {
        if (t.op === "same") return <span key={i}>{t.text}</span>;
        if (t.op === "add")
          return (
            <span
              key={i}
              className="rounded-[2px] bg-accent/10 text-accent underline decoration-accent/40 decoration-1 underline-offset-2"
            >
              {t.text}
            </span>
          );
        return (
          <span key={i} className="text-muted line-through decoration-bad/50">
            {t.text}
          </span>
        );
      })}
    </p>
  );
}
