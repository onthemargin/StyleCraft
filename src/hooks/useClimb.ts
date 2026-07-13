import { useCallback, useRef, useState } from "react";
import type { AuthorTarget } from "../shared/types.ts";
import { runClimb } from "../shared/orchestrator.ts";
import { writerClient, coachClient } from "../lib/api.ts";
import { iterationToCard, type LiveCard } from "../lib/cards.ts";

export type { LiveCard };

export type ClimbPhase = "idle" | "running" | "done" | "error" | "cancelled";
export type ActiveModel = "writer" | "coach" | null;

export interface UseClimb {
  phase: ClimbPhase;
  cards: LiveCard[];
  winnerIndex: number;
  activeModel: ActiveModel;
  currentIteration: number;
  error: string | null;
  run(originalText: string, author: AuthorTarget): Promise<void>;
  cancel(): void;
  reset(): void;
}

export function useClimb(): UseClimb {
  const [phase, setPhase] = useState<ClimbPhase>("idle");
  const [cards, setCards] = useState<LiveCard[]>([]);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [activeModel, setActiveModel] = useState<ActiveModel>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setCards([]);
    setWinnerIndex(-1);
    setActiveModel(null);
    setCurrentIteration(0);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(async (originalText: string, author: AuthorTarget) => {
    if (runningRef.current) return; // single active run
    runningRef.current = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("running");
    setCards([]);
    setWinnerIndex(-1);
    setError(null);

    try {
      const result = await runClimb({
        originalText,
        author,
        writer: writerClient,
        coach: coachClient,
        signal: ctrl.signal,
        callbacks: {
          onWriterDone: (n, draft, metrics, inputText) => {
            setCurrentIteration(n);
            setActiveModel("coach");
            setCards((prev) => [
              ...prev,
              {
                iterationNumber: n,
                inputText,
                outputText: draft,
                metrics,
                status: "scoring",
                scores: null,
                critique: [],
                regressed: false,
                writerMs: 0,
                coachMs: 0,
              },
            ]);
          },
          onCoachDone: (it) => {
            setActiveModel("writer");
            setCards((prev) =>
              prev.map((c) =>
                c.iterationNumber === it.iterationNumber ? iterationToCard(it) : c,
              ),
            );
          },
        },
      });
      setWinnerIndex(result.winnerIndex);
      setActiveModel(null);
      setPhase("done");
    } catch (err) {
      setActiveModel(null);
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase("cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setPhase("error");
      }
    } finally {
      runningRef.current = false;
      abortRef.current = null;
    }
  }, []);

  return {
    phase,
    cards,
    winnerIndex,
    activeModel,
    currentIteration,
    error,
    run,
    cancel,
    reset,
  };
}
