import { describe, expect, test } from "vitest";

import type { ShowState } from "../domain/show";

import { initialState } from "../domain/show";
import { loadState, saveState, STORAGE_KEY } from "./persistence";

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
    saveState(running);
    expect(loadState(3)).toEqual(running);
  });

  test("relit un spectacle terminé", () => {
    const finished: ShowState = {
      driftMs: -1000,
      endedAt: 5000,
      phase: "finished",
      startedAt: 1000,
    };
    saveState(finished);
    expect(loadState(3)).toEqual(finished);
  });

  test("rien de sauvegardé : préparation", () => {
    expect(loadState(3)).toEqual(initialState);
  });

  test("JSON illisible : préparation", () => {
    localStorage.setItem(STORAGE_KEY, "{pas du json");
    expect(loadState(3)).toEqual(initialState);
  });

  test("forme inattendue : préparation", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phase: "running", sceneIndex: "1" }),
    );
    expect(loadState(3)).toEqual(initialState);
  });

  test("scène hors trame (trame modifiée depuis) : préparation", () => {
    saveState(running);
    expect(loadState(1)).toEqual(initialState);
  });
});
