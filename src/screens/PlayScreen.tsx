import type { RunningState, ShowAction } from "../domain/show";
import type { Trame } from "../domain/trame";

import { formatClock, formatCountdown, formatDrift } from "../domain/format";
import { computeTimers } from "../domain/timers";
import { useNow } from "../state/useNow";

interface PlayScreenProps {
  readonly dispatch: (action: ShowAction) => void;
  readonly state: RunningState;
  readonly trame: Trame;
}

export function PlayScreen({ dispatch, state, trame }: PlayScreenProps) {
  const now = useNow();
  const openEdition = () => {
    dispatch({ type: "openEdition" });
  };

  if (state.message !== null) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-12 p-8">
        <p className="text-center text-8xl font-bold">{state.message}</p>
        <EditionButton onClick={openEdition} />
      </main>
    );
  }

  const timers = computeTimers(state, trame, now);
  const drift = formatDrift(timers.driftMs);

  return (
    <main className="grid h-dvh grid-rows-[auto_1fr_auto] gap-6 p-6">
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl bg-neutral-900 p-6">
          <span className="text-2xl text-neutral-400">Scène actuelle</span>
          <p className="text-6xl font-bold">{timers.currentScene}</p>
        </div>
        {timers.nextScene !== null && (
          <div className="rounded-2xl bg-neutral-900 p-6">
            <span className="text-2xl text-neutral-400">Scène suivante</span>
            <p className="text-6xl font-bold text-neutral-300">
              {timers.nextScene}
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 place-content-center gap-8">
        <Clock label="Écoulé spectacle" ms={timers.elapsedMs} />
        <Clock countdown label="Reste spectacle" ms={timers.showRemainingMs} />
        <Clock label="Écoulé scène" ms={timers.sceneElapsedMs} />
        <Clock
          countdown
          danger={timers.sceneRemainingMs < 0}
          label="Reste scène"
          ms={timers.sceneRemainingMs}
        />
      </section>

      <footer className="flex items-center justify-between">
        <EditionButton onClick={openEdition} />
        {drift !== null && (
          <span
            aria-label="Glissement"
            className={`text-4xl font-bold ${timers.driftMs > 0 ? "text-green-400" : "text-red-500"}`}
            role="status"
          >
            {drift}
          </span>
        )}
        <button
          className="rounded-xl bg-blue-600 px-10 py-6 text-4xl font-bold active:bg-blue-700"
          onClick={() => {
            dispatch({ now: Date.now(), type: "next" });
          }}
          type="button"
        >
          {timers.isLastScene ? "Terminer" : "Scène suivante"}
        </button>
      </footer>
    </main>
  );
}

function Clock({
  countdown = false,
  danger = false,
  label,
  ms,
}: {
  readonly countdown?: boolean;
  readonly danger?: boolean;
  readonly label: string;
  readonly ms: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl text-neutral-400">{label}</span>
      <span
        aria-label={label}
        className={`font-mono text-7xl font-bold tabular-nums ${danger ? "text-red-500" : ""}`}
        role="timer"
      >
        {countdown ? formatCountdown(ms) : formatClock(ms)}
      </span>
    </div>
  );
}

function EditionButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      className="rounded-xl bg-neutral-700 px-8 py-4 text-3xl active:bg-neutral-600"
      onClick={onClick}
      type="button"
    >
      Édition
    </button>
  );
}
