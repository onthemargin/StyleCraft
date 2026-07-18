import { ITERATIONS, TARGET_SCORE } from "../shared/constants.ts";
import type { LiveCard } from "../lib/cards.ts";

// The climb, drawn: match score (0–100) per iteration, plotted as it happens.
// Points land as each iteration is scored, the line grows to meet them, the
// winning point is emphasized and regressions are flagged in red.
const W = 520;
const H = 150;
const PAD = { l: 30, r: 16, t: 18, b: 24 };

export function ClimbChart({
  cards,
  winnerIndex,
}: {
  cards: LiveCard[];
  winnerIndex: number;
}) {
  const slots = ITERATIONS;
  const x = (i: number) =>
    PAD.l + (slots <= 1 ? 0 : (i / (slots - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);

  const pts = cards
    .map((c, i) => ({ i, v: c.scores?.overall ?? null, regressed: c.regressed }))
    .filter((p): p is { i: number; v: number; regressed: boolean } => p.v !== null);

  const line = pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
  const ticks = [0, 50, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: "auto" }}
      role="img"
      aria-label={
        pts.length
          ? `Match score by iteration: ${pts.map((p) => p.v).join(", ")}`
          : "Match score chart"
      }
    >
      {/* y gridlines + labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--color-hair)"
            strokeWidth={1}
          />
          <text
            x={PAD.l - 6}
            y={y(t) + 3}
            textAnchor="end"
            fontSize={9}
            fill="var(--color-muted)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* target line */}
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={y(TARGET_SCORE)}
        y2={y(TARGET_SCORE)}
        stroke="var(--color-accent-soft)"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />
      <text
        x={PAD.l + 4}
        y={y(TARGET_SCORE) - 4}
        textAnchor="start"
        fontSize={8}
        fill="var(--color-accent-soft)"
        className="uppercase"
        letterSpacing="0.08em"
      >
        target {TARGET_SCORE}
      </text>

      {/* x-axis iteration labels */}
      {Array.from({ length: slots }, (_, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-muted)"
        >
          {i + 1}
        </text>
      ))}

      {/* the climb */}
      {pts.length > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: "all 300ms ease" }}
        />
      )}

      {pts.map((p) => {
        const isWinner = p.i === winnerIndex;
        // Drop the label below points that sit near the dashed target line so
        // the two never crowd; keep it above for the lower parts of the climb.
        const below = p.v >= TARGET_SCORE - 6;
        const labelY = below ? y(p.v) + 16 : y(p.v) - 10;
        return (
          <g key={p.i} style={{ transition: "all 300ms ease" }}>
            <circle
              cx={x(p.i)}
              cy={y(p.v)}
              r={isWinner ? 5 : 3.5}
              fill={isWinner ? "var(--color-accent)" : "var(--color-paper)"}
              stroke={p.regressed ? "var(--color-bad)" : "var(--color-accent)"}
              strokeWidth={2}
            />
            <text
              x={x(p.i)}
              y={labelY}
              textAnchor="middle"
              fontSize={11}
              fontWeight={isWinner ? 700 : 500}
              fill={
                p.regressed
                  ? "var(--color-bad)"
                  : isWinner
                    ? "var(--color-accent)"
                    : "var(--color-ink)"
              }
              // Paper-colored halo so the number reads cleanly over any line.
              stroke="var(--color-paper)"
              strokeWidth={3}
              paintOrder="stroke"
              className="tnum"
            >
              {p.v}
              {p.regressed ? " ▼" : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
