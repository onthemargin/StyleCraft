import { useEffect, useState } from "react";
import type { AuthorTarget } from "./shared/types.ts";
import { AUTHORS } from "./shared/authors.ts";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "./shared/constants.ts";
import { useClimb } from "./hooks/useClimb.ts";
import { Gallery } from "./components/Gallery.tsx";
import { TextInput } from "./components/TextInput.tsx";
import { AuthorSelector } from "./components/AuthorSelector.tsx";
import { ProgressLoop } from "./components/ProgressLoop.tsx";
import { RunView } from "./components/RunView.tsx";
import { CloudNote } from "./components/CloudNote.tsx";

const DEMO_TEXT =
  "The meeting was good and we discussed many things that will probably help us in the future.";
const DEMO_AUTHOR: AuthorTarget = "hemingway";

type Mode = "gallery" | "live";

export function App() {
  const [mode, setMode] = useState<Mode>("gallery");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState<AuthorTarget>("hemingway");
  const [mock, setMock] = useState(false);
  const climb = useClimb();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE ?? "/stylecraft/api"}/health`)
      .then((r) => r.json())
      .then((h) => setMock(Boolean(h?.mock)))
      .catch(() => {});
  }, []);

  const running = climb.phase === "running";
  const len = text.trim().length;
  const canRun = !running && len >= MIN_INPUT_CHARS && text.length <= MAX_INPUT_CHARS;

  const goLive = () => {
    setMode("live");
    climb.reset();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-5 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1
            className="text-3xl font-semibold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            StyleCraft
          </h1>
          <nav className="flex gap-1 text-xs" aria-label="Mode">
            <button
              type="button"
              onClick={() => setMode("gallery")}
              className={`rounded-full px-3 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                mode === "gallery" ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              Examples
            </button>
            <button
              type="button"
              onClick={goLive}
              className={`rounded-full px-3 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                mode === "live" ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              Try your own
            </button>
          </nav>
        </div>
        <p className="max-w-prose text-[15px] leading-relaxed text-muted">
          Rewrite your words in a master&rsquo;s voice. StyleCraft rewrites your text,
          then critiques its own work and revises again — five times — getting closer
          with each pass. Watch it improve, step by step.
        </p>
      </header>

      {mode === "gallery" ? (
        <Gallery onTryYourOwn={goLive} />
      ) : (
        <div className="flex flex-col gap-6">
          {climb.phase === "idle" || climb.phase === "error" || climb.phase === "cancelled" ? (
            <div className="flex flex-col gap-5">
              <TextInput
                value={text}
                onChange={setText}
                onLoadExample={() => {
                  setText(DEMO_TEXT);
                  setAuthor(DEMO_AUTHOR);
                }}
                disabled={running}
              />
              <AuthorSelector value={author} onChange={setAuthor} disabled={running} />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canRun}
                  onClick={() => climb.run(text.trim(), author)}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Run 5 revisions →
                </button>
                {mock && (
                  <span className="rounded-full border border-hair px-2 py-0.5 text-[10px] uppercase tracking-wide text-warn">
                    simulated (no cloud key)
                  </span>
                )}
              </div>
              <CloudNote />
              {climb.phase === "error" && (
                <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad" role="alert">
                  {climb.error} — adjust and try again.
                </p>
              )}
              {climb.phase === "cancelled" && (
                <p className="text-sm text-muted">Run cancelled.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[15px] leading-relaxed text-muted">
                <span className="text-ink">Original.</span> {text.trim()}
              </p>
              <p className="text-xs text-muted">
                Voice: {AUTHORS[author].label}
              </p>
            </div>
          )}

          {running && (
            <ProgressLoop
              activeModel={climb.activeModel}
              currentIteration={climb.currentIteration}
              onCancel={climb.cancel}
            />
          )}

          {climb.cards.length > 0 && (
            <RunView
              original={text.trim()}
              authorLabel={AUTHORS[author].label}
              cards={climb.cards}
              winnerIndex={climb.winnerIndex}
              showFinal={climb.phase === "done"}
              note={mock ? "simulated" : undefined}
              onReset={() => {
                climb.reset();
                setText("");
              }}
              onTryAnother={() => climb.reset()}
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
