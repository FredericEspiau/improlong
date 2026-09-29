import type { Trame } from "./domain/trame";

import { EditionScreen } from "./screens/EditionScreen";
import { EndScreen } from "./screens/EndScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { PreparationScreen } from "./screens/PreparationScreen";
import { useShow } from "./state/useShow";
import { useWakeLock } from "./state/useWakeLock";

export function App({ trame }: { readonly trame: Trame }) {
  const [state, dispatch] = useShow(trame);
  useWakeLock(state.phase === "running");

  switch (state.phase) {
    case "finished": {
      return (
        <EndScreen
          onReset={() => {
            dispatch({ type: "reset" });
          }}
          state={state}
        />
      );
    }
    case "preparation": {
      return (
        <PreparationScreen
          onStart={() => {
            dispatch({ now: Date.now(), type: "start" });
          }}
        />
      );
    }
    case "running": {
      return state.view === "edition" ? (
        <EditionScreen dispatch={dispatch} message={state.message} />
      ) : (
        <PlayScreen dispatch={dispatch} state={state} trame={trame} />
      );
    }
  }
}
