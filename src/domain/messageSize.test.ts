import { describe, expect, test } from "vitest";

import { messageFontSizeVw } from "./messageSize";

describe("messageFontSizeVw", () => {
  test("un mot court prend un maximum de place", () => {
    expect(messageFontSizeVw("Vite !")).toBe(16);
  });

  test("plus le message est long, plus la police diminue", () => {
    const sizes = [
      "Vite !",
      "Accélérez un peu la scène",
      "Le personnage principal doit enfin révéler son secret au public",
      "x".repeat(200),
    ].map((text) => messageFontSizeVw(text));
    expect(sizes).toEqual(sizes.toSorted((a, b) => b - a));
    expect(new Set(sizes).size).toBe(4);
  });

  test("ne descend jamais sous un seuil lisible de loin", () => {
    expect(messageFontSizeVw("x".repeat(1000))).toBeGreaterThanOrEqual(3.5);
  });
});
