import { useEffect, useRef, useState } from "react";
import type { AuthorTarget } from "./shared/types.ts";
import { AUTHORS } from "./shared/authors.ts";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "./shared/constants.ts";
import { useClimb } from "./hooks/useClimb.ts";
import { useReplay } from "./hooks/useReplay.ts";
import { loadSample } from "./lib/samples.ts";
import { Gallery } from "./components/Gallery.tsx";
import { TextInput } from "./components/TextInput.tsx";
import { AuthorSelector } from "./components/AuthorSelector.tsx";
import { ProgressLoop } from "./components/ProgressLoop.tsx";
import { RunView } from "./components/RunView.tsx";
import { CloudNote } from "./components/CloudNote.tsx";

type Source = "live" | "sample" | null;

export function App() {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState<AuthorTarget>("hemingway");
  const [mock, setMock] = useState(false);
  const [source, setSource] = useState<Source>(null);
  const [context, setContext] = useState<{ original: string; authorLabel: string }>({
    original: "",
    authorLabel: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const live = useClimb();
  const replay = useReplay();
  const runRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE ?? "/stylecraft/api"}/health`)
      .then((r) => r.json())
      .then((h) => setMock(Boolean(h?.mock)))
      .catch(() => {});
  }, []);

  const runner = source === "live" ? live : source === "sample" ? replay : null;
  const busy = live.phase === "running" || replay.phase === "running";
  const showFinal = runner?.phase === "done";

  const len = text.trim().length;
  const canRun = !busy && len >= MIN_INPUT_CHARS && text.length <= MAX_INPUT_CHARS;

  const scrollToRun = () =>
    requestAnimationFrame(() => runRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  const runOwn = () => {
    replay.reset();
    setSelectedId(null);
    setLoadError(null);
    setContext({ original: text.trim(), authorLabel: AUTHORS[author].label });
    setSource("live");
    void live.run(text.trim(), author);
    scrollToRun();
  };

  const runSample = async (id: string) => {
    setLoadError(null);
    try {
      const run = await loadSample(id);
      live.reset();
      setSelectedId(id);
      setContext({ original: run.originalText, authorLabel: AUTHORS[run.author].label });
      setSource("sample");
      void replay.start(run);
      scrollToRun();
    } catch {
      setLoadError("Could not load that example.");
    }
  };

  const clearRun = () => {
    live.reset();
    replay.reset();
    setSource(null);
    setSelectedId(null);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-col gap-3">
        <h1
          className="text-4xl font-semibold tracking-tight text-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          StyleCraft
        </h1>
        <p className="max-w-prose text-[19px] leading-relaxed text-muted">
          Rewrite your words in a master&rsquo;s voice. StyleCraft rewrites your text,
          then critiques its own work and revises again — five times — getting closer
          with each pass. Watch it climb, step by step.
        </p>
      </header>

      {/* Input beside real examples — write your own, or watch one first. */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <TextInput value={text} onChange={setText} disabled={busy} />
          <AuthorSelector value={author} onChange={setAuthor} disabled={busy} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canRun}
              onClick={runOwn}
              className="rounded-md bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rewrite in {AUTHORS[author].label}&rsquo;s voice →
            </button>
            {mock && (
              <span className="rounded-full border border-hair px-2 py-0.5 text-[10px] uppercase tracking-wide text-warn">
                simulated (no cloud key)
              </span>
            )}
          </div>
          <CloudNote />
          {live.phase === "error" && (
            <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad" role="alert">
              {live.error} — adjust and try again.
            </p>
          )}
          {loadError && <p className="text-sm text-bad">{loadError}</p>}
        </div>

        <Gallery onSelect={runSample} selectedId={selectedId} disabled={busy} />
      </section>

      {/* Unified run area (live run or sample replay) */}
      {runner && source && (
        <div ref={runRef} className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] text-muted">
              in the voice of <span className="text-ink">{context.authorLabel}</span>
              {source === "sample" && " · example"}
            </p>
            <button
              type="button"
              onClick={clearRun}
              className="shrink-0 text-xs text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              Clear
            </button>
          </div>

          {/* Original shown here only while climbing; the Final panel carries it once done. */}
          {!showFinal && context.original && (
            <p className="reading text-[18px] leading-relaxed text-muted">
              <span className="text-ink">Original.</span> {context.original}
            </p>
          )}

          {runner.phase === "running" && (
            <ProgressLoop
              activeModel={runner.activeModel}
              currentIteration={runner.currentIteration}
              onCancel={source === "live" ? live.cancel : replay.skip}
              cancelLabel={source === "live" ? "Cancel" : "Skip"}
            />
          )}

          {runner.cards.length > 0 && (
            <RunView
              original={context.original}
              authorLabel={context.authorLabel}
              cards={runner.cards}
              winnerIndex={runner.winnerIndex}
              showFinal={showFinal}
              note={source === "sample" ? "pre-generated example" : mock ? "simulated" : undefined}
            />
          )}
        </div>
      )}

      <footer className="mt-auto border-t border-hair pt-4 text-[11px] text-muted">
        Writer: Gemini 2.5 Flash-Lite · Coach: Gemini 2.5 Pro · no writing stored.
      </footer>
    </div>
  );
}
