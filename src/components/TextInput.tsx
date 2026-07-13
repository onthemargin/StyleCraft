import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "../shared/constants.ts";

export function TextInput({
  value,
  onChange,
  onLoadExample,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onLoadExample: () => void;
  disabled?: boolean;
}) {
  const len = value.length;
  const near = len > MAX_INPUT_CHARS * 0.85;
  const over = len > MAX_INPUT_CHARS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="sc-input"
          className="text-[11px] uppercase tracking-widest text-muted"
        >
          Your text
        </label>
        <button
          type="button"
          onClick={onLoadExample}
          disabled={disabled}
          className="text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        >
          Load example
        </button>
      </div>
      <textarea
        id="sc-input"
        value={value}
        maxLength={MAX_INPUT_CHARS}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Paste a sentence or short paragraph…"
        className="w-full resize-y rounded-md border border-hair bg-white/50 px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-muted/60 focus-visible:border-accent/60 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
      />
      <div className="flex justify-between text-[11px] text-muted">
        <span>{len < MIN_INPUT_CHARS ? "A sentence or short paragraph." : " "}</span>
        <span className={`tnum ${over ? "text-bad" : near ? "text-warn" : "text-muted"}`}>
          {len} / {MAX_INPUT_CHARS}
        </span>
      </div>
    </div>
  );
}
