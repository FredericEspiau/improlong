import { describe, expect, test } from "vitest";

import type { ShowState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { initialState } from "../domain/show";
import { loadState, saveState, STORAGE_KEY } from "./persistence";

const threeScenes: Trame = {
  scenes: [
    { durationMs: 1000, name: "A" },
    { durationMs: 2000, name: "B" },
    { durationMs: 3000, name: "C" },
  ],
  totalMs: 6000,
};

const running: ShowState = {
  driftMs: 30_000,
  message: "Accélérez",
  phase: "running",
  sceneIndex: 1,
  sceneStartedAt: 2000,
  startedAt: 1000,
  view: "jeu",
};

describe("persistence", () => {
  test("relit ce qui a été sauvegardé", () => {
    saveState(running, threeScenes);
    expect(loadState(threeScenes)).toEqual(running);
  });

  test("relit un spectacle terminé", () => {
    const finished: ShowState = {
      driftMs: -1000,
      endedAt: 5000,
      phase: "finished",
      startedAt: 1000,
    };
    saveState(finished, threeScenes);
    expect(loadState(threeScenes)).toEqual(finished);
  });

  test("rien de sauvegardé : préparation", () => {
    expect(loadState(threeScenes)).toEqual(initialState);
  });

  test("JSON illisible : préparation", () => {
    localStorage.setItem(STORAGE_KEY, "{pas du json");
    expect(loadState(threeScenes)).toEqual(initialState);
  });

  test("forme inattendue : préparation", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phase: "running", sceneIndex: "1" }),
    );
    expect(loadState(threeScenes)).toEqual(initialState);
  });

  test("scène hors trame (trame raccourcie depuis) : préparation", () => {
    saveState(running, threeScenes);
    const oneScene: Trame = {
      scenes: [{ durationMs: 1000, name: "A" }],
      totalMs: 1000,
    };
    expect(loadState(oneScene)).toEqual(initialState);
  });

  test("trame modifiée avec le même nombre de scènes : préparation", () => {
    saveState(running, threeScenes);
    const renamed: Trame = {
      ...threeScenes,
      scenes: threeScenes.scenes.map((scene) => ({
        ...scene,
        name: `${scene.name}2`,
      })),
    };
    expect(loadState(renamed)).toEqual(initialState);
  });
});
