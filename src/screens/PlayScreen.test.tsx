import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { RunningState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { PlayScreen } from "./PlayScreen";

const MIN = 60_000;
const T0 = new Date("2026-10-01T20:00:00").getTime();

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 10 * MIN, name: "Fin" },
  ],
  totalMs: 15 * MIN,
};

function renderAt(now: number, state: RunningState) {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const dispatch = vi.fn();
  render(<PlayScreen dispatch={dispatch} state={state} trame={testTrame} />);
  return dispatch;
}

function running(overrides: Partial<RunningState> = {}): RunningState {
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

describe("PlayScreen", () => {
  test("affiche scène actuelle, scène suivante et timers", () => {
    renderAt(T0 + MIN, running());
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Fin")).toBeInTheDocument();
    expect(screen.getByLabelText("Reste scène")).toHaveTextContent("4:00");
    expect(screen.getByLabelText("Reste spectacle")).toHaveTextContent("14:00");
  });

  test("au départ, les temps restants affichent la durée pleine", () => {
    renderAt(T0 + 400, running());
    expect(screen.getByLabelText("Reste scène")).toHaveTextContent("5:00");
    expect(screen.getByLabelText("Reste spectacle")).toHaveTextContent("15:00");
  });

  test("dès le premier instant de dépassement : signe moins et rouge", () => {
    renderAt(T0 + 5 * MIN + 400, running());
    const remaining = screen.getByLabelText("Reste scène");
    expect(remaining).toHaveTextContent("-0:01");
    expect(remaining).toHaveClass("text-danger");
  });

  test("dépassement : temps de scène négatif en rouge", () => {
    renderAt(T0 + 372_000, running());
    const remaining = screen.getByLabelText("Reste scène");
    expect(remaining).toHaveTextContent("-1:12");
    expect(remaining).toHaveClass("text-danger");
  });

  test("affiche le glissement", () => {
    renderAt(
      T0 + 5 * MIN,
      running({ driftMs: 30_000, sceneIndex: 1, sceneStartedAt: T0 + 5 * MIN }),
    );
    expect(screen.getByLabelText("Glissement")).toHaveTextContent("+30 s");
  });

  test("dernière scène : bouton Terminer, pas de scène suivante", () => {
    const dispatch = renderAt(
      T0 + 6 * MIN,
      running({ sceneIndex: 1, sceneStartedAt: T0 + 5 * MIN }),
    );
    expect(screen.queryByText("Scène suivante")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(dispatch).toHaveBeenCalledWith({ now: T0 + 6 * MIN, type: "next" });
  });

  test("message : un message court est affiché plus gros qu'un long", () => {
    renderAt(T0, running({ message: "Vite !" }));
    const shortSize = screen.getByText("Vite !").style.fontSize;
    cleanup();
    renderAt(
      T0,
      running({
        message:
          "Le personnage principal doit enfin révéler son secret au public",
      }),
    );
    const longSize = screen.getByText(/personnage principal/).style.fontSize;
    expect(shortSize).toBe("16vw");
    expect(longSize).toBe("6.5vw");
  });

  test("message : n'affiche que le message et le bouton Édition", () => {
    const dispatch = renderAt(T0, running({ message: "Accélérez" }));
    expect(screen.getByText("Accélérez")).toBeInTheDocument();
    expect(screen.queryByText("Intro")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Édition" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "openEdition" });
  });

  test("hiérarchie : 'Reste scène' est l'horloge principale, les autres sont plus petites", () => {
    renderAt(T0 + MIN, running());
    expect(screen.getByLabelText("Reste scène")).toHaveClass(
      "text-[min(18vw,28vh)]",
    );
    for (const label of [
      "Écoulé scène",
      "Écoulé spectacle",
      "Reste spectacle",
    ]) {
      expect(screen.getByLabelText(label)).toHaveClass("text-[5vw]");
    }
  });

  test("dernière minute : le temps de scène passe en ambre", () => {
    renderAt(T0 + 5 * MIN - 30_000, running());
    const remaining = screen.getByLabelText("Reste scène");
    expect(remaining).toHaveClass("text-warn");
    expect(remaining).not.toHaveClass("text-danger");
    expect(remaining).toHaveTextContent("0:30");
  });

  test("plus d'une minute restante : ni ambre ni rouge", () => {
    renderAt(T0 + MIN, running());
    const remaining = screen.getByLabelText("Reste scène");
    expect(remaining).not.toHaveClass("text-warn");
    expect(remaining).not.toHaveClass("text-danger");
  });

  test("barre de progression de la scène", () => {
    renderAt(T0 + 2.5 * MIN, running());
    const bar = screen.getByRole("progressbar", {
      name: "Avancement de la scène",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  test("la barre reste à 100 % en cas de dépassement", () => {
    renderAt(T0 + 9 * MIN, running());
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  test("dernière scène : la carte 'Scène actuelle' prend toute la largeur", () => {
    renderAt(
      T0 + 6 * MIN,
      running({ sceneIndex: 1, sceneStartedAt: T0 + 5 * MIN }),
    );
    expect(screen.getByText("Scène actuelle").parentElement).toHaveClass(
      "col-span-2",
    );
  });

  test("avec une scène suivante, chaque carte garde sa moitié", () => {
    renderAt(T0 + MIN, running());
    expect(screen.getByText("Scène actuelle").parentElement).not.toHaveClass(
      "col-span-2",
    );
  });
});
