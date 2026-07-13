import { useCallback, useRef, useState } from "react";
import type { SampleRun } from "../shared/types.ts";
import { iterationToCard, type LiveCard } from "../lib/cards.ts";
import type { ActiveModel, ClimbPhase } from "./useClimb.ts";

// Replays a pre-generated SampleRun with time delays so a curated example feels
// like a real live run: the Writer's draft appears, a beat passes, the Coach's
// scores fill in, then the next iteration streams in. Same view-model shape as
// useClimb so RunView/ProgressLoop are shared.

const WRITER_MS = 750;
const COACH_MS = 1150;
const GAP_MS = 350;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("skip", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("skip", "AbortError"));
      },
      { once: true },
    );
  });
}

const scoringCard = (run: SampleRun, i: number): LiveCard => ({
  ...iterationToCard(run.iterations[i]),
  status: "scoring",
  scores: null,
  critique: [],
  regressed: false,
});

export interface UseReplay {
  phase: ClimbPhase;
  cards: LiveCard[];
  winnerIndex: number;
  activeModel: ActiveModel;
  currentIteration: number;
  start(run: SampleRun): Promise<void>;
  /** Skip the animation and jump straight to the finished result. */
  skip(): void;
  reset(): void;
}

export function useReplay(): UseReplay {
  const [phase, setPhase] = useState<ClimbPhase>("idle");
  const [cards, setCards] = useState<LiveCard[]>([]);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [activeModel, setActiveModel] = useState<ActiveModel>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setCards([]);
    setWinnerIndex(-1);
    setActiveModel(null);
    setCurrentIteration(0);
  }, []);

  const skip = useCallback(() => abortRef.current?.abort(), []);

  const start = useCallback(async (run: SampleRun) => {
    if (runningRef.current) abortRef.current?.abort();
    runningRef.current = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("running");
    setCards([]);
    setWinnerIndex(-1);

    try {
      for (let i = 0; i < run.iterations.length; i++) {
        const it = run.iterations[i];
        setCurrentIteration(it.iterationNumber);
        setActiveModel("writer");
        setCards((prev) => [...prev, scoringCard(run, i)]);
        await sleep(WRITER_MS, ctrl.signal);
        setActiveModel("coach");
        await sleep(COACH_MS, ctrl.signal);
        setCards((prev) =>
          prev.map((c) => (c.iterationNumber === it.iterationNumber ? iterationToCard(it) : c)),
        );
        await sleep(GAP_MS, ctrl.signal);
      }
    } catch {
      // Skipped — fall through to the full result below.
    } finally {
      runningRef.current = false;
    }

    // Whether it finished naturally or was skipped, land on the full result.
    setCards(run.iterations.map(iterationToCard));
    setWinnerIndex(run.winnerIndex);
    setActiveModel(null);
    setPhase("done");
  }, []);

  return { phase, cards, winnerIndex, activeModel, currentIteration, start, skip, reset };
}
