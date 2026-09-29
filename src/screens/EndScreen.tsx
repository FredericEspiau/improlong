import { useState } from "react";

import type { FinishedState } from "../domain/show";

import { formatClock, formatDrift } from "../domain/format";

interface EndScreenProps {
  readonly onReset: () => void;
  readonly state: FinishedState;
}

export function EndScreen({ onReset, state }: EndScreenProps) {
  const [confirming, setConfirming] = useState(false);

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
      {confirming ? (
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-2xl">
            Effacer ce spectacle et revenir au départ ?
          </p>
          <div className="flex gap-6">
            <button
              className="rounded-xl bg-neutral-700 px-8 py-4 text-2xl"
              onClick={() => {
                setConfirming(false);
              }}
              type="button"
            >
              Annuler
            </button>
            <button
              className="rounded-xl bg-red-600 px-8 py-4 text-2xl"
              onClick={onReset}
              type="button"
            >
              Oui, effacer
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-10 rounded-xl bg-neutral-700 px-8 py-4 text-2xl"
          onClick={() => {
            setConfirming(true);
          }}
          type="button"
        >
          Nouveau spectacle
        </button>
      )}
    </main>
  );
}
