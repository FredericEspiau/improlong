import type { RunningState } from "./show";
import type { Trame } from "./trame";

export interface Timers {
  readonly currentScene: string;
  readonly driftMs: number;
  readonly elapsedMs: number;
  readonly isLastScene: boolean;
  readonly nextScene: null | string;
  readonly sceneElapsedMs: number;
  readonly sceneRemainingMs: number;
  readonly showRemainingMs: number;
}

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
    sceneRemainingMs,
    showRemainingMs: Math.max(0, sceneRemainingMs) + followingMs,
  };
}
