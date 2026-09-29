import { describe, expect, test } from "vitest";

import type { RunningState, ShowState } from "./show";
import type { Trame } from "./trame";

import { initialState, reduceShow } from "./show";

const MIN = 60_000;
const T0 = 1_000_000;

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 5 * MIN, name: "Deux" },
    { durationMs: 10 * MIN, name: "Trois" },
  ],
  totalMs: 20 * MIN,
};

function started(): RunningState {
  const state = reduceShow(initialState, { now: T0, type: "start" }, testTrame);
  if (state.phase !== "running") throw new Error("devrait être en cours");
  return state;
}

describe("reduceShow", () => {
  test("start démarre la première scène en mode jeu", () => {
    expect(started()).toEqual({
      driftMs: 0,
      message: null,
      phase: "running",
      sceneIndex: 0,
      sceneStartedAt: T0,
      startedAt: T0,
      view: "jeu",
    });
  });

  test("next avec 30 s d'avance donne un glissement de +30 s", () => {
    const afterIntro = reduceShow(
      started(),
      { now: T0 + 5 * MIN, type: "next" },
      testTrame,
    );
    const afterDeux = reduceShow(
      afterIntro,
      { now: T0 + 9.5 * MIN, type: "next" },
      testTrame,
    );
    expect(afterDeux).toMatchObject({
      driftMs: 30_000,
      sceneIndex: 2,
      sceneStartedAt: T0 + 9.5 * MIN,
    });
  });

  test("next en retard donne un glissement négatif", () => {
    const state = reduceShow(
      started(),
      { now: T0 + 372_000, type: "next" },
      testTrame,
    );
    expect(state).toMatchObject({ driftMs: -72_000, sceneIndex: 1 });
  });

  test("next sur la dernière scène termine le spectacle", () => {
    let state: ShowState = started();
    state = reduceShow(state, { now: T0 + 5 * MIN, type: "next" }, testTrame);
    state = reduceShow(state, { now: T0 + 10 * MIN, type: "next" }, testTrame);
    state = reduceShow(state, { now: T0 + 21 * MIN, type: "next" }, testTrame);
    expect(state).toEqual({
      driftMs: -MIN,
      endedAt: T0 + 21 * MIN,
      phase: "finished",
      startedAt: T0,
    });
  });

  test("un double tap (moins d'1 s) est ignoré", () => {
    const afterIntro = reduceShow(
      started(),
      { now: T0 + 5 * MIN, type: "next" },
      testTrame,
    );
    const doubleTap = reduceShow(
      afterIntro,
      { now: T0 + 5 * MIN + 300, type: "next" },
      testTrame,
    );
    expect(doubleTap).toBe(afterIntro);
  });

  test("édition et message", () => {
    let state: ShowState = started();
    state = reduceShow(state, { type: "openEdition" }, testTrame);
    expect(state).toMatchObject({ view: "edition" });
    state = reduceShow(
      state,
      { text: "  Accélérez  ", type: "showMessage" },
      testTrame,
    );
    expect(state).toMatchObject({ message: "Accélérez" });
    state = reduceShow(state, { type: "closeEdition" }, testTrame);
    expect(state).toMatchObject({ message: "Accélérez", view: "jeu" });
    state = reduceShow(state, { type: "hideMessage" }, testTrame);
    expect(state).toMatchObject({ message: null });
  });

  test("un message vide est ignoré", () => {
    const state = started();
    expect(
      reduceShow(
        state,
        { text: " ".repeat(3), type: "showMessage" },
        testTrame,
      ),
    ).toBe(state);
  });

  test("les actions de jeu sont ignorées hors spectacle", () => {
    expect(reduceShow(initialState, { now: T0, type: "next" }, testTrame)).toBe(
      initialState,
    );
  });

  test("reset revient en préparation", () => {
    expect(reduceShow(started(), { type: "reset" }, testTrame)).toEqual(
      initialState,
    );
  });
});
