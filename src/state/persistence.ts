import type { ShowState } from "../domain/show";

import { initialState } from "../domain/show";

export const STORAGE_KEY = "improlong:show:v1";

/**
Relit l'état sauvegardé. Au moindre doute, repart en préparation plutôt que d'afficher un écran cassé.
*/
export function loadState(sceneCount: number): ShowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return initialState;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed, sceneCount) ? parsed : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: ShowState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible : le spectacle continue, seule la reprise après rechargement est perdue
  }
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
