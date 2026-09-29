import { describe, expect, test } from "vitest";

import { parseTrame, trame } from "./trame";

describe("parseTrame", () => {
  test("convertit les scènes et calcule la durée totale", () => {
    const result = parseTrame({
      scenes: [
        { duration: "PT5M", name: "Intro" },
        { duration: "PT10M", name: "Fin" },
      ],
    });
    expect(result).toEqual({
      scenes: [
        { durationMs: 300_000, name: "Intro" },
        { durationMs: 600_000, name: "Fin" },
      ],
      totalMs: 900_000,
    });
  });

  test("refuse une trame sans scène", () => {
    expect(() => parseTrame({ scenes: [] })).toThrow("au moins une scène");
    expect(() => parseTrame({})).toThrow("au moins une scène");
    expect(() => parseTrame(null)).toThrow("au moins une scène");
  });

  test("refuse une scène sans nom", () => {
    expect(() =>
      parseTrame({ scenes: [{ duration: "PT5M", name: " " }] }),
    ).toThrow("Scène 1 invalide");
  });

  test("refuse une durée nulle", () => {
    expect(() =>
      parseTrame({ scenes: [{ duration: "PT0M", name: "A" }] }),
    ).toThrow("Scène 1 : la durée doit être positive");
  });
});

test("la trame du projet est valide", () => {
  expect(trame.scenes.length).toBeGreaterThan(0);
});
