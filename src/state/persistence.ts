import type { ShowState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { initialState } from "../domain/show";

export const STORAGE_KEY = "improlong:show:v1";

/**
Relit l'état sauvegardé. Au moindre doute (trame modifiée depuis, données illisibles),
repart en préparation plutôt que d'afficher un écran cassé ou une trame qui ne correspond plus.
*/
export function loadState(trame: Trame): ShowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return initialState;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.fingerprint !== fingerprint(trame)) {
      return initialState;
    }
    return isValidState(parsed.state, trame.scenes.length)
      ? parsed.state
      : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: ShowState, trame: Trame): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fingerprint: fingerprint(trame), state }),
    );
  } catch {
    // Stockage indisponible : le spectacle continue, seule la reprise après rechargement est perdue
  }
}

/**
Identifie la trame : si elle change entre deux déploiements, l'état sauvegardé n'est plus valable.
*/
function fingerprint(trame: Trame): string {
  return JSON.stringify(trame.scenes);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidState(value: unknown, sceneCount: number): value is ShowState {
  if (!isRecord(value)) {
    return false;
  }
  switch (value.phase) {
    case "finished": {
      return (
        isFiniteNumber(value.startedAt) &&
        isFiniteNumber(value.endedAt) &&
        isFiniteNumber(value.driftMs)
      );
    }
    case "preparation": {
      return true;
    }
    case "running": {
      return (
        isFiniteNumber(value.startedAt) &&
        isFiniteNumber(value.sceneStartedAt) &&
        isFiniteNumber(value.driftMs) &&
        Number.isSafeInteger(value.sceneIndex) &&
        isFiniteNumber(value.sceneIndex) &&
        value.sceneIndex >= 0 &&
        value.sceneIndex < sceneCount &&
        (value.view === "jeu" || value.view === "edition") &&
        (value.message === null || typeof value.message === "string")
      );
    }
    default: {
      return false;
    }
  }
}
