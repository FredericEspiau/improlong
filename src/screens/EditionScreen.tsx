import { useEffect, useRef, useState } from "react";

import type { ShowAction } from "../domain/show";

import { QUICK_MESSAGES } from "../quickMessages";

interface EditionScreenProps {
  readonly dispatch: (action: ShowAction) => void;
  readonly message: null | string;
}

/**
"Cacher le message" et les messages rapides occupent la même zone de l'écran : un double appui
accidentel sur l'un déclencherait l'autre. Après un changement de message, on ignore les appuis un court instant.
*/
const MESSAGE_TAP_GUARD_MS = 600;

export function EditionScreen({ dispatch, message }: EditionScreenProps) {
  const [draft, setDraft] = useState("");
  const previousMessage = useRef(message);
  const changedAt = useRef(-Infinity);

  useEffect(() => {
    if (previousMessage.current === message) {
      return;
    }

    previousMessage.current = message;
    changedAt.current = Date.now();
  }, [message]);

  const isSettled = () =>
    Date.now() - changedAt.current >= MESSAGE_TAP_GUARD_MS;

  return (
    <main className="flex h-dvh flex-col gap-6 p-8">
      <h1 className="text-4xl font-bold">Édition</h1>

      {message === null ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {QUICK_MESSAGES.map((quick) => (
              <button
                className="min-h-16 rounded-xl bg-line px-6 py-4 text-3xl font-bold active:brightness-125"
                key={quick}
                onClick={() => {
                  if (isSettled()) {
                    dispatch({ text: quick, type: "showMessage" });
                  }
                }}
                type="button"
              >
                {quick}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-2 text-2xl" htmlFor="message">
            Message pour les comédiens
          </label>
          <textarea
            className="min-h-40 rounded-xl bg-surface p-4 text-3xl"
            id="message"
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            value={draft}
          />
          <button
            className="rounded-xl bg-action px-8 py-4 text-3xl disabled:opacity-40"
            disabled={draft.trim() === ""}
            onClick={() => {
              dispatch({ text: draft, type: "showMessage" });
              setDraft("");
            }}
            type="button"
          >
            Afficher le message
          </button>
        </>
      ) : (
        <>
          <p className="rounded-xl bg-surface p-4 text-3xl">
            Message affiché : {message}
          </p>
          <button
            className="rounded-xl bg-danger-strong px-8 py-4 text-3xl"
            onClick={() => {
              if (isSettled()) {
                dispatch({ type: "hideMessage" });
              }
            }}
            type="button"
          >
            Cacher le message
          </button>
        </>
      )}

      <button
        className="mt-auto rounded-xl bg-ok px-8 py-6 text-4xl font-bold text-background"
        onClick={() => {
          dispatch({ type: "closeEdition" });
        }}
        type="button"
      >
        Retour au jeu
      </button>
    </main>
  );
}
