import { ITERATIONS } from "../shared/constants.ts";
import type { ActiveModel } from "../hooks/useClimb.ts";

const STEPS = ["Draft", "Evaluate", "Improve", "Repeat"];

export function ProgressLoop({
  activeModel,
  currentIteration,
  onCancel,
}: {
  activeModel: ActiveModel;
  currentIteration: number;
  onCancel: () => void;
}) {
  const activeStep = activeModel === "writer" ? 0 : activeModel === "coach" ? 1 : 2;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-hair bg-white/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {STEPS.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-hair">·</span>}
              <span className={i === activeStep ? "font-medium text-accent" : ""}>{s}</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted hover:text-bad focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancel
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs" aria-live="polite">
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
          aria-hidden
        />
        <span className="text-ink">
          {activeModel === "writer"
            ? "Writer — rewriting in the cloud"
            : activeModel === "coach"
              ? "Coach — scoring in the cloud"
              : "Working…"}
        </span>
        <span className="tnum text-muted">
          iteration {Math.max(1, currentIteration)} / {ITERATIONS}
        </span>
      </div>
    </div>
  );
}
