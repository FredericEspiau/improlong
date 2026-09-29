import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Trame } from "./domain/trame";

import { App } from "./App";

const MIN = 60_000;
const T0 = new Date("2026-10-01T20:00:00").getTime();

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 5 * MIN, name: "Deux" },
    { durationMs: 10 * MIN, name: "Trois" },
    { durationMs: 25 * MIN, name: "Final" },
  ],
  totalMs: 45 * MIN,
};

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  test("exemple du README : +30 s d'avance et 35:00 restant", () => {
    render(<App trame={testTrame} />);
    click("Démarrer");
    advance(5 * MIN);
    click("Scène suivante");
    advance(4.5 * MIN);
    click("Scène suivante");
    expect(screen.getByLabelText("Glissement")).toHaveTextContent("+30 s");
    expect(screen.getByLabelText("Reste spectacle")).toHaveTextContent("35:00");
    expect(screen.getByLabelText("Reste scène")).toHaveTextContent("10:00");
  });

  test("message : affiché en jeu, caché depuis l'édition", () => {
    render(<App trame={testTrame} />);
    click("Démarrer");
    click("Édition");
    fireEvent.change(screen.getByLabelText("Message pour les comédiens"), {
      target: { value: "Accélérez" },
    });
    click("Afficher le message");
    click("Retour au jeu");
    expect(screen.getByText("Accélérez")).toBeInTheDocument();
    click("Édition");
    click("Cacher le message");
    click("Retour au jeu");
    expect(screen.queryByText("Accélérez")).not.toBeInTheDocument();
  });

  test("les timers continuent en mode édition", () => {
    render(<App trame={testTrame} />);
    click("Démarrer");
    click("Édition");
    advance(2 * MIN);
    click("Retour au jeu");
    expect(screen.getByLabelText("Écoulé spectacle")).toHaveTextContent("2:00");
  });

  test("rechargement : l'état et les timers reprennent", () => {
    const { unmount } = render(<App trame={testTrame} />);
    click("Démarrer");
    advance(5 * MIN);
    click("Scène suivante");
    advance(MIN);
    unmount();

    render(<App trame={testTrame} />);
    expect(screen.getByText("Deux")).toBeInTheDocument();
    expect(screen.getByLabelText("Écoulé spectacle")).toHaveTextContent("6:00");
    expect(screen.getByLabelText("Reste scène")).toHaveTextContent("4:00");
  });

  test("fin : écran figé puis nouveau spectacle", () => {
    render(<App trame={testTrame} />);
    click("Démarrer");
    for (const duration of [5, 5, 10]) {
      advance(duration * MIN);
      click("Scène suivante");
    }
    advance(26 * MIN);
    click("Terminer");
    expect(screen.getByText("Spectacle terminé")).toBeInTheDocument();
    expect(screen.getByLabelText("Durée totale")).toHaveTextContent("46:00");
    expect(screen.getByLabelText("Glissement final")).toHaveTextContent(
      "-1 min",
    );
    advance(5 * MIN);
    expect(screen.getByLabelText("Durée totale")).toHaveTextContent("46:00");
    click("Nouveau spectacle");
    expect(screen.getByText("Spectacle terminé")).toBeInTheDocument();
    click("Oui, effacer");
    expect(
      screen.getByRole("button", { name: "Démarrer" }),
    ).toBeInTheDocument();
  });

  test("fin : on peut annuler la remise à zéro", () => {
    render(<App trame={testTrame} />);
    click("Démarrer");
    for (const duration of [5, 5, 10, 25]) {
      advance(duration * MIN);
      click(duration === 25 ? "Terminer" : "Scène suivante");
    }
    click("Nouveau spectacle");
    click("Annuler");
    expect(screen.getByLabelText("Durée totale")).toHaveTextContent("45:00");
    expect(
      screen.getByRole("button", { name: "Nouveau spectacle" }),
    ).toBeInTheDocument();
  });
});
