import { describe, expect, test } from "vitest";

import type { RunningState } from "./show";
import type { Trame } from "./trame";

import { computeTimers } from "./timers";

const MIN = 60_000;
const T0 = 1_000_000;

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 5 * MIN, name: "Deux" },
    { durationMs: 10 * MIN, name: "Trois" },
    { durationMs: 25 * MIN, name: "Fin" },
  ],
  totalMs: 45 * MIN,
};

function running(overrides: Partial<RunningState>): RunningState {
  return {
    driftMs: 0,
    message: null,
    phase: "running",
    sceneIndex: 0,
    sceneStartedAt: T0,
    startedAt: T0,
    view: "jeu",
    ...overrides,
  };
}

describe("computeTimers", () => {
  test("exemple du README : passage à la scène 3 avec 30 s d'avance", () => {
    const state = running({
      driftMs: 30_000,
      sceneIndex: 2,
      sceneStartedAt: T0 + 9.5 * MIN,
    });
    expect(computeTimers(state, testTrame, T0 + 9.5 * MIN)).toEqual({
      currentScene: "Trois",
      driftMs: 30_000,
      elapsedMs: 9.5 * MIN,
      isLastScene: false,
      nextScene: "Fin",
      sceneElapsedMs: 0,
      sceneRemainingMs: 10 * MIN,
      showRemainingMs: 35 * MIN,
    });
  });

  test("scène en dépassement : temps de scène négatif, spectacle bloqué aux scènes suivantes", () => {
    const timers = computeTimers(running({}), testTrame, T0 + 6 * MIN);
    expect(timers.sceneRemainingMs).toBe(-MIN);
    expect(timers.showRemainingMs).toBe(40 * MIN);
  });

  test("dernière scène : pas de scène suivante", () => {
    const state = running({ sceneIndex: 3, sceneStartedAt: T0 + 20 * MIN });
    const timers = computeTimers(state, testTrame, T0 + 21 * MIN);
    expect(timers.nextScene).toBeNull();
    expect(timers.isLastScene).toBe(true);
    expect(timers.showRemainingMs).toBe(24 * MIN);
  });
});
