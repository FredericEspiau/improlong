import type { Trame } from "./trame";

export interface FinishedState {
  readonly driftMs: number;
  readonly endedAt: number;
  readonly phase: "finished";
  readonly startedAt: number;
}

export interface RunningState {
  readonly driftMs: number;
  readonly message: null | string;
  readonly phase: "running";
  readonly sceneIndex: number;
  readonly sceneStartedAt: number;
  readonly startedAt: number;
  readonly view: View;
}

export type ShowAction =
  | { readonly now: number; readonly type: "next" }
  | { readonly now: number; readonly type: "start" }
  | { readonly text: string; readonly type: "showMessage" }
  | { readonly type: "closeEdition" }
  | { readonly type: "hideMessage" }
  | { readonly type: "openEdition" }
  | { readonly type: "reset" };

export type ShowState =
  | FinishedState
  | RunningState
  | { readonly phase: "preparation" };

export type View = "edition" | "jeu";

export const initialState: ShowState = { phase: "preparation" };

/**
Un second appui sur « Scène suivante » dans ce délai est considéré comme accidentel.
*/
export const DOUBLE_TAP_GUARD_MS = 1000;

export function reduceShow(
  state: ShowState,
  action: ShowAction,
  trame: Trame,
): ShowState {
  if (action.type === "reset") {
    return initialState;
  }
  if (action.type === "start") {
    return state.phase === "preparation"
      ? {
          driftMs: 0,
          message: null,
          phase: "running",
          sceneIndex: 0,
          sceneStartedAt: action.now,
          startedAt: action.now,
          view: "jeu",
        }
      : state;
  }
  if (state.phase !== "running") {
    return state;
  }
  switch (action.type) {
    case "closeEdition": {
      return { ...state, view: "jeu" };
    }
    case "hideMessage": {
      return { ...state, message: null };
    }
    case "next": {
      return nextScene(state, action.now, trame);
    }
    case "openEdition": {
      return { ...state, view: "edition" };
    }
    case "showMessage": {
      const message = action.text.trim();
      return message === "" ? state : { ...state, message };
    }
  }
}

function nextScene(state: RunningState, now: number, trame: Trame): ShowState {
  if (now - state.sceneStartedAt < DOUBLE_TAP_GUARD_MS) {
    return state;
  }
  const scene = trame.scenes[state.sceneIndex];
  if (scene === undefined) {
    return state;
  }
  // Positif = avance, négatif = retard
  const driftMs =
    state.driftMs + scene.durationMs - (now - state.sceneStartedAt);
  const sceneIndex = state.sceneIndex + 1;
  if (sceneIndex >= trame.scenes.length) {
    return {
      driftMs,
      endedAt: now,
      phase: "finished",
      startedAt: state.startedAt,
    };
  }
  return { ...state, driftMs, sceneIndex, sceneStartedAt: now };
}
