import { fireEvent, render, screen } from "@testing-library/react";
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

  test("dépassement : temps de scène négatif en rouge", () => {
    renderAt(T0 + 372_000, running());
    const remaining = screen.getByLabelText("Reste scène");
    expect(remaining).toHaveTextContent("-1:12");
    expect(remaining).toHaveClass("text-red-500");
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

  test("message : n'affiche que le message et le bouton Édition", () => {
    const dispatch = renderAt(T0, running({ message: "Accélérez" }));
    expect(screen.getByText("Accélérez")).toBeInTheDocument();
    expect(screen.queryByText("Intro")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Édition" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "openEdition" });
  });
});
