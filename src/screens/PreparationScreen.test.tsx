import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { PreparationScreen } from "./PreparationScreen";

function setOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

describe("PreparationScreen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("réseau actif : rappelle de passer en mode avion", () => {
    setOnline(true);
    render(<PreparationScreen onStart={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("mode avion");
  });

  test("hors-ligne : pas de rappel", () => {
    setOnline(false);
    render(<PreparationScreen onStart={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("le rappel disparaît dès que la tablette passe hors-ligne", () => {
    setOnline(true);
    render(<PreparationScreen onStart={vi.fn()} />);
    setOnline(false);
    act(() => {
      dispatchEvent(new Event("offline"));
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
