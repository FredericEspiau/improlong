import { useEffect, useReducer } from "react";

import type { ShowAction, ShowState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { reduceShow } from "../domain/show";
import { loadState, saveState } from "./persistence";

export function useShow(
  trame: Trame,
): readonly [ShowState, (action: ShowAction) => void] {
  const [state, dispatch] = useReducer(
    (current: ShowState, action: ShowAction) =>
      reduceShow(current, action, trame),
    trame.scenes.length,
    loadState,
  );
  useEffect(() => {
    saveState(state);
  }, [state]);
  return [state, dispatch] as const;
}
