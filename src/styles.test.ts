import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const css = readFileSync("src/index.css", "utf8");
const html = readFileSync("index.html", "utf8");

describe("robustesse tactile", () => {
  test("bloque le pull-to-refresh, le zoom au double tap et la sélection de texte", () => {
    expect(css).toContain("overscroll-behavior: none");
    expect(css).toContain("touch-action: manipulation");
    expect(css).toContain("user-select: none");
  });

  test("la zone de saisie reste sélectionnable", () => {
    expect(css).toMatch(/textarea\s*\{[^}]*user-select:\s*text/);
  });

  test("le focus clavier est visible", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/);
  });

  test("déclare un thème sombre natif", () => {
    expect(html).toContain('<meta name="color-scheme" content="dark"');
  });
});
