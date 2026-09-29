import type { RunningState, ShowAction } from "../domain/show";
import type { SceneTone } from "../domain/timers";
import type { Trame } from "../domain/trame";

import { formatClock, formatCountdown, formatDrift } from "../domain/format";
import { messageFontSizeVw } from "../domain/messageSize";
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
        <p
          className="max-w-full text-center leading-tight font-bold wrap-break-word"
          style={{ fontSize: `${String(messageFontSizeVw(state.message))}vw` }}
        >
          {state.message}
        </p>
        <EditionButton onClick={openEdition} />
      </main>
    );
  }

  const timers = computeTimers(state, trame, now);
  const drift = formatDrift(timers.driftMs);

  return (
    <main className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] gap-6 p-6">
      <section className="grid grid-cols-2 gap-6">
        <div
          className={`rounded-2xl bg-surface p-6 ${timers.nextScene === null ? "col-span-2" : ""}`}
        >
          <span className="text-2xl text-ink-muted">Scène actuelle</span>
          <p className="text-6xl font-bold">{timers.currentScene}</p>
        </div>
        {timers.nextScene !== null && (
          <div className="rounded-2xl bg-surface p-6">
            <span className="text-2xl text-ink-muted">Scène suivante</span>
            <p className="text-6xl font-bold text-ink/80">{timers.nextScene}</p>
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-col justify-center-safe gap-6 overflow-hidden [container-type:size]">
        <Clock
          countdown
          label="Reste scène"
          ms={timers.sceneRemainingMs}
          size="hero"
          tone={timers.sceneTone}
        />
        <div
          aria-label="Avancement de la scène"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(timers.sceneProgress * 100)}
          className="h-6 w-full rounded-full bg-line"
          role="progressbar"
        >
          <div
            className={`h-full rounded-full ${BAR_CLASS[timers.sceneTone]}`}
            style={{ width: `${String(timers.sceneProgress * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Clock label="Écoulé scène" ms={timers.sceneElapsedMs} size="small" />
          <Clock label="Écoulé spectacle" ms={timers.elapsedMs} size="small" />
          <Clock
            countdown
            label="Reste spectacle"
            ms={timers.showRemainingMs}
            size="small"
          />
        </div>
      </section>

      <footer className="flex items-center justify-between">
        <EditionButton onClick={openEdition} />
        {drift !== null && (
          <span
            aria-label="Glissement"
            className={`text-4xl font-bold ${timers.driftMs > 0 ? "text-ok" : "text-danger"}`}
            role="status"
          >
            {drift}
          </span>
        )}
        <button
          className="rounded-xl bg-action px-10 py-6 text-4xl font-bold active:brightness-90"
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
  label,
  ms,
  size,
  tone = "ok",
}: {
  readonly countdown?: boolean;
  readonly label: string;
  readonly ms: number;
  readonly size: "hero" | "small";
  readonly tone?: SceneTone;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={
          size === "hero"
            ? "text-4xl text-ink-muted"
            : "text-2xl text-ink-muted"
        }
      >
        {label}
      </span>
      <span
        aria-label={label}
        className={`font-mono leading-none font-bold tabular-nums ${size === "hero" ? "text-[max(8rem,min(18vw,calc(100cqh_-_13rem)))]" : "text-[5vw]"} ${TEXT_CLASS[tone]}`}
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
      className="rounded-xl bg-line px-8 py-4 text-3xl active:brightness-125"
      onClick={onClick}
      type="button"
    >
      Édition
    </button>
  );
}

const BAR_CLASS: Record<SceneTone, string> = {
  ok: "bg-ok",
  overrun: "bg-danger",
  warning: "bg-warn",
};

const TEXT_CLASS: Record<SceneTone, string> = {
  ok: "",
  overrun: "text-danger",
  warning: "text-warn",
};
