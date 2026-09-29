import type { RunningState } from "./show";
import type { Trame } from "./trame";

export type SceneTone = "ok" | "overrun" | "warning";

export interface Timers {
  readonly currentScene: string;
  readonly driftMs: number;
  readonly elapsedMs: number;
  readonly isLastScene: boolean;
  readonly nextScene: null | string;
  readonly sceneElapsedMs: number;
  /**
  Avancement de la scène de 0 à 1 (borné, même en dépassement).
  */
  readonly sceneProgress: number;
  readonly sceneRemainingMs: number;
  readonly sceneTone: SceneTone;
  readonly showRemainingMs: number;
}

/**
Il reste moins d'une minute : la scène passe en ambre.
*/
export const WARNING_MS = 60_000;

/**
Temps restant du spectacle = temps restant prévu de la scène en cours (jamais sous 0)
+ durées des scènes suivantes. Le retard d'une scène en dépassement sera compté
dans le glissement au passage de scène, pas ici.
*/
export function computeTimers(
  state: RunningState,
  trame: Trame,
  now: number,
): Timers {
  const current = trame.scenes[state.sceneIndex];
  const next = trame.scenes[state.sceneIndex + 1];
  const sceneElapsedMs = now - state.sceneStartedAt;
  const sceneRemainingMs = (current?.durationMs ?? 0) - sceneElapsedMs;
  const followingMs = trame.scenes
    .slice(state.sceneIndex + 1)
    .reduce((sum, scene) => sum + scene.durationMs, 0);
  return {
    currentScene: current?.name ?? "",
    driftMs: state.driftMs,
    elapsedMs: now - state.startedAt,
    isLastScene: next === undefined,
    nextScene: next?.name ?? null,
    sceneElapsedMs,
    sceneProgress: clamp(sceneElapsedMs / (current?.durationMs ?? 1)),
    sceneRemainingMs,
    sceneTone: toneFor(sceneRemainingMs),
    showRemainingMs: Math.max(0, sceneRemainingMs) + followingMs,
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toneFor(remainingMs: number): SceneTone {
  if (remainingMs < 0) {
    return "overrun";
  }
  return remainingMs <= WARNING_MS ? "warning" : "ok";
}
