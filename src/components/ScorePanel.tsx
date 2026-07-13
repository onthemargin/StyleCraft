import type { EvaluationScores } from "../shared/types.ts";

const AXES: { key: keyof Omit<EvaluationScores, "overall">; label: string }[] = [
  { key: "voiceMatch", label: "Voice" },
  { key: "diction", label: "Diction" },
  { key: "tone", label: "Tone" },
  { key: "fidelity", label: "Fidelity" },
];

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_1.75rem] items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-hair">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="tnum text-right text-xs text-ink">{value}</span>
    </div>
  );
}

export function ScorePanel({ scores }: { scores: EvaluationScores }) {
  return (
    <div className="flex flex-col gap-1.5">
      {AXES.map((a) => (
        <Bar key={a.key} label={a.label} value={scores[a.key]} />
      ))}
    </div>
  );
}
