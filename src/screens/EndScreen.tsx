import type { FinishedState } from "../domain/show";

import { formatClock, formatDrift } from "../domain/format";

interface EndScreenProps {
  readonly onReset: () => void;
  readonly state: FinishedState;
}

export function EndScreen({ onReset, state }: EndScreenProps) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-10">
      <h1 className="text-7xl font-bold">Spectacle terminé</h1>
      <p className="text-4xl">
        Durée totale :{" "}
        <span
          aria-label="Durée totale"
          className="font-mono font-bold"
          role="timer"
        >
          {formatClock(state.endedAt - state.startedAt)}
        </span>
      </p>
      <p className="text-4xl">
        Glissement final :{" "}
        <span aria-label="Glissement final" className="font-bold" role="status">
          {formatDrift(state.driftMs) ?? "pile à l'heure"}
        </span>
      </p>
      <button
        className="mt-10 rounded-xl bg-neutral-700 px-8 py-4 text-2xl"
        onClick={onReset}
        type="button"
      >
        Nouveau spectacle
      </button>
    </main>
  );
}
