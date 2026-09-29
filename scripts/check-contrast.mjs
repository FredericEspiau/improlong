// Vérifie le contraste WCAG des paires texte/fond du thème (src/index.css, bloc @theme).
// Usage : node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const theme = Object.fromEntries(
  css
    .matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)
    .map((match) => [match[1], match[2]]),
);

// [texte, fond, seuil, usage] — 3 pour le texte ≥ 24 px gras (WCAG « grand texte »), 4.5 sinon
const PAIRS = [
  ["ink", "background", 4.5, "texte principal"],
  ["ink", "surface", 4.5, "texte sur carte"],
  ["ink-muted", "background", 4.5, "libellés"],
  ["ink-muted", "surface", 4.5, "libellés sur carte"],
  ["danger", "background", 4.5, "dépassement / retard"],
  ["danger", "surface", 4.5, "dépassement sur carte"],
  ["warn", "background", 4.5, "dernière minute"],
  ["ok", "background", 4.5, "avance"],
  ["background", "ok", 4.5, "bouton Démarrer"],
  ["ink", "action", 4.5, "bouton Scène suivante"],
  ["ink", "danger-strong", 4.5, "bouton Cacher / Oui, effacer"],
  ["ink", "line", 3, "bouton secondaire (grand texte)"],
];

function luminance(hex) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratio(foreground, background) {
  const [lighter, darker] = [
    luminance(foreground),
    luminance(background),
  ].toSorted((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
}

let hasFailure = false;
for (const [foreground, background, minimum, usage] of PAIRS) {
  if (theme[foreground] === undefined || theme[background] === undefined) {
    console.log(`?? jeton manquant : ${foreground} ou ${background}`);
    hasFailure = true;
    continue;
  }
  const value = ratio(theme[foreground], theme[background]);
  const isEnough = value >= minimum;
  hasFailure ||= !isEnough;
  console.log(
    `${isEnough ? "OK " : "KO "} ${value.toFixed(2)}:1 (min ${String(minimum)}) ${foreground} sur ${background} — ${usage}`,
  );
}
process.exitCode = hasFailure ? 1 : 0;
