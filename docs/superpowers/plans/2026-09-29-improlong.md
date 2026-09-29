# ImproLong : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** construire une PWA hors-ligne pour tablette Android qui affiche aux comédiens les timers et les scènes d'une impro longue, et qui laisse le metteur en scène afficher un message.

**Architecture :** toute la logique est pure et testée à part (`src/domain/`) : parsing de la trame, reducer d'état, calcul des timers, formatage. L'état ne stocke que des horodatages (`startedAt`, `sceneStartedAt`) : les timers se recalculent avec `Date.now()`, donc un rechargement ne perd rien. L'état est sauvegardé dans `localStorage` à chaque changement. React se contente d'afficher : un écran par mode.

**Tech Stack :** TypeScript 6, React 19.3, Vite 8.3, Tailwind 4.3 (`@tailwindcss/vite`), vite-plugin-pwa 1.3, Vitest 5 + jsdom + Testing Library, pnpm 12.

**Spec :** `README.md`

## Global Constraints

- Un seul client : tablette Android, Chrome, en paysage.
- 100 % hors-ligne une fois installée (PWA, service worker qui précache tout).
- La trame est codée en dur dans `src/trame.json`, sans édition. Les durées sont en ISO 8601 (`PT5M`). Durée totale = somme des scènes.
- Trois modes : `préparation` (un seul bouton `Démarrer`), `jeu`, `édition`.
- Passage de scène manuel uniquement.
- Glissement = somme de (durée prévue − durée réelle) des scènes terminées. Positif = avance (`+30 s`), négatif = retard (`-1 min 12 s`).
- Temps restant du spectacle = temps restant prévu de la scène en cours + durées des scènes suivantes. Le glissement n'y est pas inclus.
- Scène en dépassement : son temps restant devient négatif, en rouge (`-1:12`).
- Dernière scène : pas de "scène suivante", le bouton devient `Terminer`, puis écran de fin figé (temps total + glissement final).
- Les timers continuent de tourner en mode `édition`.
- Message affiché en `jeu` : on n'affiche que le message, et le bouton `Édition` reste visible.
- L'état survit à un rechargement accidentel.
- Textes de l'interface en français. Code en anglais.
- Lisible de loin : gros chiffres, fort contraste.

## Review Focus

1. **Rechargement en pleine scène** : après un refresh, les timers reprennent là où ils en étaient (pas de remise à zéro), avec le message affiché s'il y en avait un. Testé dans la tâche 8.
2. **Stockage corrompu ou trame modifiée entre deux déploiements** (JSON illisible, `sceneIndex` hors limites) : retour propre en mode `préparation`, jamais d'écran blanc. Testé dans la tâche 6.
3. **Double tap sur `Scène suivante`** : un tap accidentel en double ne doit pas sauter une scène. On ignore un `next` moins d'1 s après le début de la scène. Testé dans la tâche 4.
4. **Scène en dépassement** : le temps restant de la scène est négatif et rouge. Le temps restant du spectacle ne descend pas sous la somme des scènes suivantes, puisque le retard sera compté dans le glissement au passage de scène. Testé dans les tâches 5 et 7.
5. **Mise en veille de l'écran** : le wake lock est redemandé quand l'app redevient visible. Vérification manuelle dans la tâche 9 (jsdom n'a pas de wake lock).

## Structure des fichiers

```
src/
  trame.json                 trame du spectacle (données)
  main.tsx                   point d'entrée React
  index.css                  import Tailwind
  vite-env.d.ts              types Vite
  App.tsx                    choisit l'écran selon l'état
  App.test.tsx               tests d'intégration (parcours complet)
  domain/
    duration.ts(+.test)      parseIsoDuration
    trame.ts(+.test)         types Scene/Trame, parseTrame
    format.ts(+.test)        formatClock, formatDrift
    show.ts(+.test)          ShowState, ShowAction, reduceShow
    timers.ts(+.test)        computeTimers
  state/
    persistence.ts(+.test)   loadState, saveState (localStorage)
    useShow.ts               useReducer + sauvegarde
    useNow.ts                horloge qui se rafraîchit
    useWakeLock.ts           garde l'écran allumé
  screens/
    PreparationScreen.tsx
    PlayScreen.tsx
    EditionScreen.tsx
    EndScreen.tsx
  test/setup.ts              setup Vitest
public/favicon.svg           source des icônes PWA
```

---

### Tâche 1 : squelette Vite + React + Tailwind + Vitest

**Files :**
- Modify : `package.json`, `tsconfig.json`, `eslint.config.js`
- Create : `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/App.test.tsx`

**Interfaces :**
- Produces : `App` (composant sans props pour l'instant), scripts `pnpm dev|build|preview|test|typecheck|lint`.

- [ ] **Étape 1 : installer les dépendances**

```bash
pnpm add react@19.3.0 react-dom@19.3.0 vite@8.3.1 @vitejs/plugin-react@6.1.1 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 vitest@5.0.2 jsdom@30.1.1 @testing-library/react@16.3.3 @testing-library/jest-dom@7.0.1 @types/react@19.3.0 @types/react-dom@19.3.0
```

Le `package.json` actuel met tout dans `dependencies` : on garde cette convention.

- [ ] **Étape 2 : ajouter les scripts dans `package.json`**

Remplacer le bloc `scripts` par :

```json
"scripts": {
  "build": "vite build",
  "clean": "rm -rf node_modules pnpm-lock.yaml && pnpm i",
  "dev": "vite",
  "lint": "eslint . && biome check .",
  "preview": "vite preview",
  "test": "vitest run",
  "typecheck": "tsc --noEmit -p ."
}
```

Supprimer `"main": "index.js"` (inutile pour une app).

- [ ] **Étape 3 : adapter `tsconfig.json`**

Dans `compilerOptions`, remplacer `"lib": ["ESNext"]` par `"lib": ["ESNext", "DOM", "DOM.Iterable"]` et ajouter `"jsx": "react-jsx"`. Ne pas toucher à `include` : `src` couvre déjà les `.tsx`.

- [ ] **Étape 4 : ajouter les globals navigateur pour ESLint**

Dans `eslint.config.js`, bloc `files: ["**/*.{ts,tsx}"]`, remplacer :

```js
      globals: {
        ...globals.node,
      },
```

par :

```js
      globals: {
        ...globals.browser,
        ...globals.node,
      },
```

- [ ] **Étape 5 : créer `vite.config.ts`**

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Étape 6 : créer `index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>ImproLong</title>
  </head>
  <body class="bg-black text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Étape 7 : créer `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`**

`src/index.css` :

```css
@import "tailwindcss";
```

`src/vite-env.d.ts` :

```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts` :

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});
```

- [ ] **Étape 8 : écrire le test qui échoue, `src/App.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("affiche le nom de l'app", () => {
  render(<App />);
  expect(screen.getByText("ImproLong")).toBeInTheDocument();
});
```

- [ ] **Étape 9 : lancer le test, il doit échouer**

Run : `pnpm test`
Expected : FAIL, `Failed to resolve import "./App"`.

- [ ] **Étape 10 : créer `src/App.tsx` et `src/main.tsx`**

`src/App.tsx` :

```tsx
export function App() {
  return <h1 className="text-4xl">ImproLong</h1>;
}
```

`src/main.tsx` :

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./index.css";

const root = document.querySelector("#root");
if (root === null) {
  throw new Error("Élément #root introuvable dans index.html");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Étape 11 : vérifier**

Run : `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected : tout passe. Corriger les erreurs de lint si besoin (règles strictes : perfectionist trie les imports, unicorn, etc.).

- [ ] **Étape 12 : commit**

```bash
git add -A
git commit -m "chore: scaffold Vite, React, Tailwind and Vitest"
```

---

### Tâche 2 : parsing des durées et de la trame

**Files :**
- Create : `src/domain/duration.ts`, `src/domain/duration.test.ts`, `src/domain/trame.ts`, `src/domain/trame.test.ts`, `src/trame.json`

**Interfaces :**
- Produces :
  - `parseIsoDuration(value: string): number` (millisecondes, lève une `Error` si invalide)
  - `interface Scene { readonly name: string; readonly durationMs: number }`
  - `interface Trame { readonly scenes: ReadonlyArray<Scene>; readonly totalMs: number }`
  - `parseTrame(raw: unknown): Trame`
  - `trame: Trame` (trame chargée depuis `src/trame.json`)

On écrit un petit parser plutôt que `Temporal.Duration` : on ne sait pas quelle version de Chrome tourne sur la tablette, et on n'a besoin que de `PTnHnMnS`.

- [ ] **Étape 1 : écrire les tests qui échouent, `src/domain/duration.test.ts`**

```ts
import { describe, expect, test } from "vitest";

import { parseIsoDuration } from "./duration";

describe("parseIsoDuration", () => {
  test.each([
    ["PT5M", 300_000],
    ["PT35M", 2_100_000],
    ["PT30S", 30_000],
    ["PT1H", 3_600_000],
    ["PT1H2M3S", 3_723_000],
  ])("%s vaut %i ms", (input, expected) => {
    expect(parseIsoDuration(input)).toBe(expected);
  });

  test.each(["", "PT", "5M", "45M", "P1D", "PT1.5M", "pt5m"])(
    "refuse %j",
    (input) => {
      expect(() => parseIsoDuration(input)).toThrow("Durée ISO 8601 invalide");
    },
  );
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/domain/duration.test.ts`
Expected : FAIL, module `./duration` introuvable.

- [ ] **Étape 3 : implémenter `src/domain/duration.ts`**

```ts
const ISO_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

/** Convertit une durée ISO 8601 limitée à heures/minutes/secondes (ex. `PT5M`) en millisecondes. */
export function parseIsoDuration(value: string): number {
  const match = ISO_DURATION.exec(value);
  if (match === null || value === "PT") {
    throw new Error(`Durée ISO 8601 invalide : "${value}"`);
  }
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000;
}
```

- [ ] **Étape 4 : lancer, doit passer**

Run : `pnpm vitest run src/domain/duration.test.ts`
Expected : PASS.

- [ ] **Étape 5 : écrire les tests qui échouent, `src/domain/trame.test.ts`**

```ts
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
    expect(() => parseTrame({ scenes: [{ duration: "PT5M", name: " " }] })).toThrow(
      "Scène 1 invalide",
    );
  });

  test("refuse une durée nulle", () => {
    expect(() => parseTrame({ scenes: [{ duration: "PT0M", name: "A" }] })).toThrow(
      "Scène 1 : la durée doit être positive",
    );
  });
});

test("la trame du projet est valide", () => {
  expect(trame.scenes.length).toBeGreaterThan(0);
});
```

- [ ] **Étape 6 : lancer, doit échouer**

Run : `pnpm vitest run src/domain/trame.test.ts`
Expected : FAIL, module `./trame` introuvable.

- [ ] **Étape 7 : créer `src/trame.json`**

```json
{
  "scenes": [
    { "name": "Introduction", "duration": "PT5M" },
    { "name": "Milieu", "duration": "PT35M" },
    { "name": "Fin", "duration": "PT5M" }
  ]
}
```

- [ ] **Étape 8 : implémenter `src/domain/trame.ts`**

```ts
import rawTrame from "../trame.json";
import { parseIsoDuration } from "./duration";

export interface Scene {
  readonly durationMs: number;
  readonly name: string;
}

export interface Trame {
  readonly scenes: ReadonlyArray<Scene>;
  readonly totalMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseScene(raw: unknown, index: number): Scene {
  const position = index + 1;
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    raw.name.trim() === "" ||
    typeof raw.duration !== "string"
  ) {
    throw new Error(`Scène ${position} invalide : il faut "name" et "duration"`);
  }
  const durationMs = parseIsoDuration(raw.duration);
  if (durationMs <= 0) {
    throw new Error(`Scène ${position} : la durée doit être positive`);
  }
  return { durationMs, name: raw.name };
}

/** Valide la trame brute (JSON) et la convertit en millisecondes. */
export function parseTrame(raw: unknown): Trame {
  if (!isRecord(raw) || !Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw new Error("Trame invalide : il faut au moins une scène");
  }
  const rawScenes: ReadonlyArray<unknown> = raw.scenes;
  const scenes = rawScenes.map((scene, index) => parseScene(scene, index));
  const totalMs = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  return { scenes, totalMs };
}

export const trame: Trame = parseTrame(rawTrame);
```

- [ ] **Étape 9 : lancer, doit passer**

Run : `pnpm vitest run src/domain && pnpm typecheck && pnpm lint`
Expected : PASS.

- [ ] **Étape 10 : commit**

```bash
git add src/domain src/trame.json
git commit -m "feat: parse ISO 8601 durations and the show trame"
```

---

### Tâche 3 : formatage des temps

**Files :**
- Create : `src/domain/format.ts`, `src/domain/format.test.ts`

**Interfaces :**
- Produces :
  - `formatClock(ms: number): string` → `"4:30"`, `"35:00"`, `"1:02:03"`, `"-1:12"`
  - `formatDrift(ms: number): string | null` → `"+30 s"`, `"-1 min 12 s"`, `"+2 min"`, `null` si 0

- [ ] **Étape 1 : écrire les tests qui échouent, `src/domain/format.test.ts`**

```ts
import { describe, expect, test } from "vitest";

import { formatClock, formatDrift } from "./format";

describe("formatClock", () => {
  test.each([
    [0, "0:00"],
    [999, "0:00"],
    [270_000, "4:30"],
    [2_100_000, "35:00"],
    [3_723_000, "1:02:03"],
    [-72_000, "-1:12"],
    [-500, "0:00"],
  ])("%i ms s'affiche %s", (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });
});

describe("formatDrift", () => {
  test.each([
    [30_000, "+30 s"],
    [-72_000, "-1 min 12 s"],
    [120_000, "+2 min"],
    [0, null],
    [400, null],
  ])("%i ms s'affiche %j", (ms, expected) => {
    expect(formatDrift(ms)).toBe(expected);
  });
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/domain/format.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter `src/domain/format.ts`**

```ts
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Horloge `m:ss` ou `h:mm:ss`, préfixée par `-` si négative. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const body =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  return ms < 0 && totalSeconds > 0 ? `-${body}` : body;
}

/** Glissement lisible : `+30 s` (avance), `-1 min 12 s` (retard), `null` si nul. */
export function formatDrift(ms: number): string | null {
  const totalSeconds = Math.round(Math.abs(ms) / 1000);
  if (totalSeconds === 0) {
    return null;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [minutes > 0 ? `${minutes} min` : "", seconds > 0 ? `${seconds} s` : ""];
  const sign = ms > 0 ? "+" : "-";
  return `${sign}${parts.filter((part) => part !== "").join(" ")}`;
}
```

- [ ] **Étape 4 : lancer, doit passer**

Run : `pnpm vitest run src/domain/format.test.ts && pnpm lint`
Expected : PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/domain/format.ts src/domain/format.test.ts
git commit -m "feat: format clocks and drift"
```

---

### Tâche 4 : reducer de l'état du spectacle

**Files :**
- Create : `src/domain/show.ts`, `src/domain/show.test.ts`

**Interfaces :**
- Consumes : `Trame` (tâche 2)
- Produces :

```ts
export type View = "edition" | "jeu";
export interface RunningState {
  readonly driftMs: number;
  readonly message: string | null;
  readonly phase: "running";
  readonly sceneIndex: number;
  readonly sceneStartedAt: number;
  readonly startedAt: number;
  readonly view: View;
}
export interface FinishedState {
  readonly driftMs: number;
  readonly endedAt: number;
  readonly phase: "finished";
  readonly startedAt: number;
}
export type ShowState = FinishedState | RunningState | { readonly phase: "preparation" };
export type ShowAction =
  | { readonly now: number; readonly type: "next" }
  | { readonly now: number; readonly type: "start" }
  | { readonly text: string; readonly type: "showMessage" }
  | { readonly type: "closeEdition" }
  | { readonly type: "hideMessage" }
  | { readonly type: "openEdition" }
  | { readonly type: "reset" };
export const initialState: ShowState;
export const DOUBLE_TAP_GUARD_MS = 1000;
export function reduceShow(state: ShowState, action: ShowAction, trame: Trame): ShowState;
```

`now` est passé dans l'action : le reducer reste pur et testable sans fausse horloge.

**Contribution utilisateur possible** (étape 3) : le calcul du glissement dans le cas `"next"`. C'est la règle métier centrale du README. La solution de référence est donnée plus bas.

- [ ] **Étape 1 : écrire les tests qui échouent, `src/domain/show.test.ts`**

```ts
import { describe, expect, test } from "vitest";

import type { RunningState, ShowState } from "./show";
import type { Trame } from "./trame";

import { initialState, reduceShow } from "./show";

const MIN = 60_000;
const T0 = 1_000_000;

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 5 * MIN, name: "Deux" },
    { durationMs: 10 * MIN, name: "Trois" },
  ],
  totalMs: 20 * MIN,
};

function started(): RunningState {
  const state = reduceShow(initialState, { now: T0, type: "start" }, testTrame);
  if (state.phase !== "running") throw new Error("devrait être en cours");
  return state;
}

describe("reduceShow", () => {
  test("start démarre la première scène en mode jeu", () => {
    expect(started()).toEqual({
      driftMs: 0,
      message: null,
      phase: "running",
      sceneIndex: 0,
      sceneStartedAt: T0,
      startedAt: T0,
      view: "jeu",
    });
  });

  test("next avec 30 s d'avance donne un glissement de +30 s", () => {
    const afterIntro = reduceShow(started(), { now: T0 + 5 * MIN, type: "next" }, testTrame);
    const afterDeux = reduceShow(
      afterIntro,
      { now: T0 + 9.5 * MIN, type: "next" },
      testTrame,
    );
    expect(afterDeux).toMatchObject({
      driftMs: 30_000,
      sceneIndex: 2,
      sceneStartedAt: T0 + 9.5 * MIN,
    });
  });

  test("next en retard donne un glissement négatif", () => {
    const state = reduceShow(started(), { now: T0 + 372_000, type: "next" }, testTrame);
    expect(state).toMatchObject({ driftMs: -72_000, sceneIndex: 1 });
  });

  test("next sur la dernière scène termine le spectacle", () => {
    let state: ShowState = started();
    state = reduceShow(state, { now: T0 + 5 * MIN, type: "next" }, testTrame);
    state = reduceShow(state, { now: T0 + 10 * MIN, type: "next" }, testTrame);
    state = reduceShow(state, { now: T0 + 21 * MIN, type: "next" }, testTrame);
    expect(state).toEqual({
      driftMs: -MIN,
      endedAt: T0 + 21 * MIN,
      phase: "finished",
      startedAt: T0,
    });
  });

  test("un double tap (moins d'1 s) est ignoré", () => {
    const afterIntro = reduceShow(started(), { now: T0 + 5 * MIN, type: "next" }, testTrame);
    const doubleTap = reduceShow(
      afterIntro,
      { now: T0 + 5 * MIN + 300, type: "next" },
      testTrame,
    );
    expect(doubleTap).toBe(afterIntro);
  });

  test("édition et message", () => {
    let state: ShowState = started();
    state = reduceShow(state, { type: "openEdition" }, testTrame);
    expect(state).toMatchObject({ view: "edition" });
    state = reduceShow(state, { text: "  Accélérez  ", type: "showMessage" }, testTrame);
    expect(state).toMatchObject({ message: "Accélérez" });
    state = reduceShow(state, { type: "closeEdition" }, testTrame);
    expect(state).toMatchObject({ message: "Accélérez", view: "jeu" });
    state = reduceShow(state, { type: "hideMessage" }, testTrame);
    expect(state).toMatchObject({ message: null });
  });

  test("un message vide est ignoré", () => {
    const state = started();
    expect(reduceShow(state, { text: "   ", type: "showMessage" }, testTrame)).toBe(state);
  });

  test("les actions de jeu sont ignorées hors spectacle", () => {
    expect(reduceShow(initialState, { now: T0, type: "next" }, testTrame)).toBe(initialState);
  });

  test("reset revient en préparation", () => {
    expect(reduceShow(started(), { type: "reset" }, testTrame)).toEqual(initialState);
  });
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/domain/show.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter `src/domain/show.ts`**

```ts
import type { Trame } from "./trame";

export type View = "edition" | "jeu";

export interface RunningState {
  readonly driftMs: number;
  readonly message: string | null;
  readonly phase: "running";
  readonly sceneIndex: number;
  readonly sceneStartedAt: number;
  readonly startedAt: number;
  readonly view: View;
}

export interface FinishedState {
  readonly driftMs: number;
  readonly endedAt: number;
  readonly phase: "finished";
  readonly startedAt: number;
}

export type ShowState = FinishedState | RunningState | { readonly phase: "preparation" };

export type ShowAction =
  | { readonly now: number; readonly type: "next" }
  | { readonly now: number; readonly type: "start" }
  | { readonly text: string; readonly type: "showMessage" }
  | { readonly type: "closeEdition" }
  | { readonly type: "hideMessage" }
  | { readonly type: "openEdition" }
  | { readonly type: "reset" };

export const initialState: ShowState = { phase: "preparation" };

/** Un second appui sur « Scène suivante » dans ce délai est considéré comme accidentel. */
export const DOUBLE_TAP_GUARD_MS = 1000;

function nextScene(state: RunningState, now: number, trame: Trame): ShowState {
  if (now - state.sceneStartedAt < DOUBLE_TAP_GUARD_MS) {
    return state;
  }
  const scene = trame.scenes[state.sceneIndex];
  if (scene === undefined) {
    return state;
  }
  // Positif = avance, négatif = retard
  const driftMs = state.driftMs + scene.durationMs - (now - state.sceneStartedAt);
  const sceneIndex = state.sceneIndex + 1;
  if (sceneIndex >= trame.scenes.length) {
    return { driftMs, endedAt: now, phase: "finished", startedAt: state.startedAt };
  }
  return { ...state, driftMs, sceneIndex, sceneStartedAt: now };
}

export function reduceShow(state: ShowState, action: ShowAction, trame: Trame): ShowState {
  if (action.type === "reset") {
    return initialState;
  }
  if (action.type === "start") {
    return state.phase === "preparation"
      ? {
          driftMs: 0,
          message: null,
          phase: "running",
          sceneIndex: 0,
          sceneStartedAt: action.now,
          startedAt: action.now,
          view: "jeu",
        }
      : state;
  }
  if (state.phase !== "running") {
    return state;
  }
  switch (action.type) {
    case "closeEdition": {
      return { ...state, view: "jeu" };
    }
    case "hideMessage": {
      return { ...state, message: null };
    }
    case "next": {
      return nextScene(state, action.now, trame);
    }
    case "openEdition": {
      return { ...state, view: "edition" };
    }
    case "showMessage": {
      const message = action.text.trim();
      return message === "" ? state : { ...state, message };
    }
  }
}
```

- [ ] **Étape 4 : lancer, doit passer**

Run : `pnpm vitest run src/domain/show.test.ts && pnpm typecheck && pnpm lint`
Expected : PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/domain/show.ts src/domain/show.test.ts
git commit -m "feat: add show state reducer with drift tracking"
```

---

### Tâche 5 : calcul des timers

**Files :**
- Create : `src/domain/timers.ts`, `src/domain/timers.test.ts`

**Interfaces :**
- Consumes : `RunningState` (tâche 4), `Trame` (tâche 2)
- Produces :

```ts
export interface Timers {
  readonly currentScene: string;
  readonly driftMs: number;
  readonly elapsedMs: number;
  readonly isLastScene: boolean;
  readonly nextScene: string | null;
  readonly sceneElapsedMs: number;
  readonly sceneRemainingMs: number;
  readonly showRemainingMs: number;
}
export function computeTimers(state: RunningState, trame: Trame, now: number): Timers;
```

- [ ] **Étape 1 : écrire les tests qui échouent, `src/domain/timers.test.ts`**

```ts
import { describe, expect, test } from "vitest";

import type { RunningState } from "./show";
import type { Trame } from "./trame";

import { computeTimers } from "./timers";

const MIN = 60_000;
const T0 = 1_000_000;

const testTrame: Trame = {
  scenes: [
    { durationMs: 5 * MIN, name: "Intro" },
    { durationMs: 5 * MIN, name: "Deux" },
    { durationMs: 10 * MIN, name: "Trois" },
    { durationMs: 25 * MIN, name: "Fin" },
  ],
  totalMs: 45 * MIN,
};

function running(overrides: Partial<RunningState>): RunningState {
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

describe("computeTimers", () => {
  test("exemple du README : passage à la scène 3 avec 30 s d'avance", () => {
    const state = running({ driftMs: 30_000, sceneIndex: 2, sceneStartedAt: T0 + 9.5 * MIN });
    expect(computeTimers(state, testTrame, T0 + 9.5 * MIN)).toEqual({
      currentScene: "Trois",
      driftMs: 30_000,
      elapsedMs: 9.5 * MIN,
      isLastScene: false,
      nextScene: "Fin",
      sceneElapsedMs: 0,
      sceneRemainingMs: 10 * MIN,
      showRemainingMs: 35 * MIN,
    });
  });

  test("scène en dépassement : temps de scène négatif, spectacle bloqué aux scènes suivantes", () => {
    const timers = computeTimers(running({}), testTrame, T0 + 6 * MIN);
    expect(timers.sceneRemainingMs).toBe(-MIN);
    expect(timers.showRemainingMs).toBe(40 * MIN);
  });

  test("dernière scène : pas de scène suivante", () => {
    const state = running({ sceneIndex: 3, sceneStartedAt: T0 + 20 * MIN });
    const timers = computeTimers(state, testTrame, T0 + 21 * MIN);
    expect(timers.nextScene).toBeNull();
    expect(timers.isLastScene).toBe(true);
    expect(timers.showRemainingMs).toBe(24 * MIN);
  });
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/domain/timers.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter `src/domain/timers.ts`**

```ts
import type { RunningState } from "./show";
import type { Trame } from "./trame";

export interface Timers {
  readonly currentScene: string;
  readonly driftMs: number;
  readonly elapsedMs: number;
  readonly isLastScene: boolean;
  readonly nextScene: string | null;
  readonly sceneElapsedMs: number;
  readonly sceneRemainingMs: number;
  readonly showRemainingMs: number;
}

/**
 * Temps restant du spectacle = temps restant prévu de la scène en cours (jamais sous 0)
 * + durées des scènes suivantes. Le retard d'une scène en dépassement sera compté
 * dans le glissement au passage de scène, pas ici.
 */
export function computeTimers(state: RunningState, trame: Trame, now: number): Timers {
  const current = trame.scenes[state.sceneIndex];
  const next = trame.scenes[state.sceneIndex + 1];
  const sceneElapsedMs = now - state.sceneStartedAt;
  const sceneRemainingMs = (current?.durationMs ?? 0) - sceneElapsedMs;
  const followingMs = trame.scenes
    .slice(state.sceneIndex + 1)
    .reduce((sum, scene) => sum + scene.durationMs, 0);
  return {
    currentScene: current?.name ?? "",
    driftMs: state.driftMs,
    elapsedMs: now - state.startedAt,
    isLastScene: next === undefined,
    nextScene: next?.name ?? null,
    sceneElapsedMs,
    sceneRemainingMs,
    showRemainingMs: Math.max(0, sceneRemainingMs) + followingMs,
  };
}
```

- [ ] **Étape 4 : lancer, doit passer**

Run : `pnpm vitest run src/domain && pnpm lint`
Expected : PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/domain/timers.ts src/domain/timers.test.ts
git commit -m "feat: compute show and scene timers"
```

---

### Tâche 6 : sauvegarde et hooks d'état

**Files :**
- Create : `src/state/persistence.ts`, `src/state/persistence.test.ts`, `src/state/useShow.ts`, `src/state/useNow.ts`

**Interfaces :**
- Consumes : `ShowState`, `ShowAction`, `initialState`, `reduceShow` (tâche 4), `Trame` (tâche 2)
- Produces :
  - `STORAGE_KEY = "improlong:show:v1"`
  - `loadState(sceneCount: number): ShowState`
  - `saveState(state: ShowState): void`
  - `useShow(trame: Trame): readonly [ShowState, (action: ShowAction) => void]`
  - `useNow(intervalMs?: number): number`

- [ ] **Étape 1 : écrire les tests qui échouent, `src/state/persistence.test.ts`**

```ts
import { describe, expect, test } from "vitest";

import type { ShowState } from "../domain/show";

import { initialState } from "../domain/show";
import { loadState, saveState, STORAGE_KEY } from "./persistence";

const running: ShowState = {
  driftMs: 30_000,
  message: "Accélérez",
  phase: "running",
  sceneIndex: 1,
  sceneStartedAt: 2000,
  startedAt: 1000,
  view: "jeu",
};

describe("persistence", () => {
  test("relit ce qui a été sauvegardé", () => {
    saveState(running);
    expect(loadState(3)).toEqual(running);
  });

  test("relit un spectacle terminé", () => {
    const finished: ShowState = { driftMs: -1000, endedAt: 5000, phase: "finished", startedAt: 1000 };
    saveState(finished);
    expect(loadState(3)).toEqual(finished);
  });

  test("rien de sauvegardé : préparation", () => {
    expect(loadState(3)).toEqual(initialState);
  });

  test("JSON illisible : préparation", () => {
    localStorage.setItem(STORAGE_KEY, "{pas du json");
    expect(loadState(3)).toEqual(initialState);
  });

  test("forme inattendue : préparation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase: "running", sceneIndex: "1" }));
    expect(loadState(3)).toEqual(initialState);
  });

  test("scène hors trame (trame modifiée depuis) : préparation", () => {
    saveState(running);
    expect(loadState(1)).toEqual(initialState);
  });
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/state`
Expected : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter `src/state/persistence.ts`**

```ts
import type { ShowState } from "../domain/show";

import { initialState } from "../domain/show";

export const STORAGE_KEY = "improlong:show:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidState(value: unknown, sceneCount: number): value is ShowState {
  if (!isRecord(value)) {
    return false;
  }
  switch (value.phase) {
    case "finished": {
      return (
        isFiniteNumber(value.startedAt) &&
        isFiniteNumber(value.endedAt) &&
        isFiniteNumber(value.driftMs)
      );
    }
    case "preparation": {
      return true;
    }
    case "running": {
      return (
        isFiniteNumber(value.startedAt) &&
        isFiniteNumber(value.sceneStartedAt) &&
        isFiniteNumber(value.driftMs) &&
        Number.isInteger(value.sceneIndex) &&
        isFiniteNumber(value.sceneIndex) &&
        value.sceneIndex >= 0 &&
        value.sceneIndex < sceneCount &&
        (value.view === "jeu" || value.view === "edition") &&
        (value.message === null || typeof value.message === "string")
      );
    }
    default: {
      return false;
    }
  }
}

/** Relit l'état sauvegardé. Au moindre doute, repart en préparation plutôt que d'afficher un écran cassé. */
export function loadState(sceneCount: number): ShowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return initialState;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed, sceneCount) ? parsed : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: ShowState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible : le spectacle continue, seule la reprise après rechargement est perdue
  }
}
```

- [ ] **Étape 4 : lancer, doit passer**

Run : `pnpm vitest run src/state`
Expected : PASS.

- [ ] **Étape 5 : créer `src/state/useShow.ts` et `src/state/useNow.ts`**

Ces hooks sont testés par les tests d'intégration de la tâche 8.

`src/state/useShow.ts` :

```ts
import { useEffect, useReducer } from "react";

import type { ShowAction, ShowState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { reduceShow } from "../domain/show";
import { loadState, saveState } from "./persistence";

export function useShow(trame: Trame): readonly [ShowState, (action: ShowAction) => void] {
  const [state, dispatch] = useReducer(
    (current: ShowState, action: ShowAction) => reduceShow(current, action, trame),
    trame.scenes.length,
    loadState,
  );
  useEffect(() => {
    saveState(state);
  }, [state]);
  return [state, dispatch] as const;
}
```

`src/state/useNow.ts` :

```ts
import { useEffect, useState } from "react";

/** Heure courante, rafraîchie régulièrement pour faire avancer les timers à l'écran. */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
```

- [ ] **Étape 6 : vérifier**

Run : `pnpm test && pnpm typecheck && pnpm lint`
Expected : PASS.

- [ ] **Étape 7 : commit**

```bash
git add src/state
git commit -m "feat: persist show state in localStorage"
```

---

### Tâche 7 : écrans préparation et jeu

**Files :**
- Create : `src/screens/PreparationScreen.tsx`, `src/screens/PlayScreen.tsx`, `src/screens/PlayScreen.test.tsx`

**Interfaces :**
- Consumes : `RunningState`, `ShowAction` (tâche 4), `computeTimers` (tâche 5), `formatClock`, `formatDrift` (tâche 3), `useNow` (tâche 6), `Trame`
- Produces :
  - `PreparationScreen({ onStart }: { readonly onStart: () => void })`
  - `PlayScreen({ state, trame, dispatch }: { readonly dispatch: (action: ShowAction) => void; readonly state: RunningState; readonly trame: Trame })`

- [ ] **Étape 1 : écrire les tests qui échouent, `src/screens/PlayScreen.test.tsx`**

```tsx
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

function renderAt(now: number, state: RunningState) {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const dispatch = vi.fn();
  render(<PlayScreen dispatch={dispatch} state={state} trame={testTrame} />);
  return dispatch;
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
    renderAt(T0 + 5 * MIN, running({ driftMs: 30_000, sceneIndex: 1, sceneStartedAt: T0 + 5 * MIN }));
    expect(screen.getByLabelText("Glissement")).toHaveTextContent("+30 s");
  });

  test("dernière scène : bouton Terminer, pas de scène suivante", () => {
    const dispatch = renderAt(T0 + 6 * MIN, running({ sceneIndex: 1, sceneStartedAt: T0 + 5 * MIN }));
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
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/screens`
Expected : FAIL, module introuvable.

- [ ] **Étape 3 : créer `src/screens/PreparationScreen.tsx`**

```tsx
export function PreparationScreen({ onStart }: { readonly onStart: () => void }) {
  return (
    <main className="flex h-dvh items-center justify-center">
      <button
        className="rounded-2xl bg-green-600 px-16 py-10 text-6xl font-bold active:bg-green-700"
        onClick={onStart}
        type="button"
      >
        Démarrer
      </button>
    </main>
  );
}
```

- [ ] **Étape 4 : créer `src/screens/PlayScreen.tsx`**

```tsx
import type { ShowAction, RunningState } from "../domain/show";
import type { Trame } from "../domain/trame";

import { formatClock, formatDrift } from "../domain/format";
import { computeTimers } from "../domain/timers";
import { useNow } from "../state/useNow";

interface PlayScreenProps {
  readonly dispatch: (action: ShowAction) => void;
  readonly state: RunningState;
  readonly trame: Trame;
}

function Clock({ label, ms, danger = false }: { readonly danger?: boolean; readonly label: string; readonly ms: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl text-neutral-400">{label}</span>
      <span
        aria-label={label}
        className={`font-mono text-7xl font-bold tabular-nums ${danger ? "text-red-500" : ""}`}
      >
        {formatClock(ms)}
      </span>
    </div>
  );
}

function EditionButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      className="rounded-xl bg-neutral-700 px-8 py-4 text-3xl active:bg-neutral-600"
      onClick={onClick}
      type="button"
    >
      Édition
    </button>
  );
}

export function PlayScreen({ dispatch, state, trame }: PlayScreenProps) {
  const now = useNow();
  const openEdition = () => {
    dispatch({ type: "openEdition" });
  };

  if (state.message !== null) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-12 p-8">
        <p className="text-center text-8xl font-bold">{state.message}</p>
        <EditionButton onClick={openEdition} />
      </main>
    );
  }

  const timers = computeTimers(state, trame, now);
  const drift = formatDrift(timers.driftMs);

  return (
    <main className="grid h-dvh grid-rows-[auto_1fr_auto] gap-6 p-6">
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl bg-neutral-900 p-6">
          <span className="text-2xl text-neutral-400">Scène actuelle</span>
          <p className="text-6xl font-bold">{timers.currentScene}</p>
        </div>
        {timers.nextScene !== null && (
          <div className="rounded-2xl bg-neutral-900 p-6">
            <span className="text-2xl text-neutral-400">Scène suivante</span>
            <p className="text-6xl font-bold text-neutral-300">{timers.nextScene}</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 place-content-center gap-8">
        <Clock label="Écoulé spectacle" ms={timers.elapsedMs} />
        <Clock label="Reste spectacle" ms={timers.showRemainingMs} />
        <Clock label="Écoulé scène" ms={timers.sceneElapsedMs} />
        <Clock danger={timers.sceneRemainingMs < 0} label="Reste scène" ms={timers.sceneRemainingMs} />
      </section>

      <footer className="flex items-center justify-between">
        <EditionButton onClick={openEdition} />
        {drift !== null && (
          <span
            aria-label="Glissement"
            className={`text-4xl font-bold ${timers.driftMs > 0 ? "text-green-400" : "text-red-500"}`}
          >
            {drift}
          </span>
        )}
        <button
          className="rounded-xl bg-blue-600 px-10 py-6 text-4xl font-bold active:bg-blue-700"
          onClick={() => {
            dispatch({ now: Date.now(), type: "next" });
          }}
          type="button"
        >
          {timers.isLastScene ? "Terminer" : "Scène suivante"}
        </button>
      </footer>
    </main>
  );
}
```

Note : le libellé "Scène suivante" de l'encart et celui du bouton sont identiques. Sur la dernière scène, les deux disparaissent, d'où le test `queryByText("Scène suivante")`.

- [ ] **Étape 5 : lancer, doit passer**

Run : `pnpm vitest run src/screens && pnpm typecheck && pnpm lint`
Expected : PASS.

- [ ] **Étape 6 : commit**

```bash
git add src/screens
git commit -m "feat: add preparation and play screens"
```

---

### Tâche 8 : écrans édition et fin, assemblage dans App

**Files :**
- Create : `src/screens/EditionScreen.tsx`, `src/screens/EndScreen.tsx`
- Modify : `src/App.tsx`, `src/App.test.tsx`, `src/main.tsx`

**Interfaces :**
- Consumes : tout ce qui précède
- Produces :
  - `EditionScreen({ message, dispatch }: { readonly dispatch: (action: ShowAction) => void; readonly message: string | null })`
  - `EndScreen({ state, onReset }: { readonly onReset: () => void; readonly state: FinishedState })`
  - `App({ trame }: { readonly trame: Trame })`

L'écran de fin ajoute un bouton `Nouveau spectacle`. Le README ne le demande pas, mais sans lui l'app resterait bloquée sur l'écran de fin pour toujours (l'état est sauvegardé).

- [ ] **Étape 1 : remplacer `src/App.test.tsx` par les tests d'intégration**

```tsx
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
    expect(screen.getByLabelText("Glissement final")).toHaveTextContent("-1 min");
    advance(5 * MIN);
    expect(screen.getByLabelText("Durée totale")).toHaveTextContent("46:00");
    click("Nouveau spectacle");
    expect(screen.getByRole("button", { name: "Démarrer" })).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer, doit échouer**

Run : `pnpm vitest run src/App.test.tsx`
Expected : FAIL (bouton `Démarrer` introuvable, `App` n'accepte pas encore `trame`).

- [ ] **Étape 3 : créer `src/screens/EditionScreen.tsx`**

```tsx
import { useState } from "react";

import type { ShowAction } from "../domain/show";

interface EditionScreenProps {
  readonly dispatch: (action: ShowAction) => void;
  readonly message: string | null;
}

export function EditionScreen({ dispatch, message }: EditionScreenProps) {
  const [draft, setDraft] = useState("");

  return (
    <main className="flex h-dvh flex-col gap-6 p-8">
      <h1 className="text-4xl font-bold">Édition</h1>

      {message === null ? (
        <>
          <label className="flex flex-col gap-2 text-2xl" htmlFor="message">
            Message pour les comédiens
          </label>
          <textarea
            className="min-h-40 rounded-xl bg-neutral-900 p-4 text-3xl"
            id="message"
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            value={draft}
          />
          <button
            className="rounded-xl bg-blue-600 px-8 py-4 text-3xl disabled:opacity-40"
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
          <p className="rounded-xl bg-neutral-900 p-4 text-3xl">Message affiché : {message}</p>
          <button
            className="rounded-xl bg-red-600 px-8 py-4 text-3xl"
            onClick={() => {
              dispatch({ type: "hideMessage" });
            }}
            type="button"
          >
            Cacher le message
          </button>
        </>
      )}

      <button
        className="mt-auto rounded-xl bg-green-600 px-8 py-6 text-4xl font-bold"
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
```

- [ ] **Étape 4 : créer `src/screens/EndScreen.tsx`**

```tsx
import type { FinishedState } from "../domain/show";

import { formatClock, formatDrift } from "../domain/format";

interface EndScreenProps {
  readonly onReset: () => void;
  readonly state: FinishedState;
}

export function EndScreen({ onReset, state }: EndScreenProps) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-10">
      <h1 className="text-7xl font-bold">Spectacle terminé</h1>
      <p className="text-4xl">
        Durée totale :{" "}
        <span aria-label="Durée totale" className="font-mono font-bold">
          {formatClock(state.endedAt - state.startedAt)}
        </span>
      </p>
      <p className="text-4xl">
        Glissement final :{" "}
        <span aria-label="Glissement final" className="font-bold">
          {formatDrift(state.driftMs) ?? "pile à l'heure"}
        </span>
      </p>
      <button
        className="mt-10 rounded-xl bg-neutral-700 px-8 py-4 text-2xl"
        onClick={onReset}
        type="button"
      >
        Nouveau spectacle
      </button>
    </main>
  );
}
```

- [ ] **Étape 5 : remplacer `src/App.tsx`**

```tsx
import type { Trame } from "./domain/trame";

import { EditionScreen } from "./screens/EditionScreen";
import { EndScreen } from "./screens/EndScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { PreparationScreen } from "./screens/PreparationScreen";
import { useShow } from "./state/useShow";

export function App({ trame }: { readonly trame: Trame }) {
  const [state, dispatch] = useShow(trame);

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
```

- [ ] **Étape 6 : passer la trame dans `src/main.tsx`**

Ajouter l'import `import { trame } from "./domain/trame";` et remplacer `<App />` par `<App trame={trame} />`.

- [ ] **Étape 7 : lancer, doit passer**

Run : `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected : PASS.

- [ ] **Étape 8 : vérification visuelle**

Run : `pnpm dev`, ouvrir l'URL affichée, passer la fenêtre en paysage (DevTools, format tablette 1280×800). Dérouler un spectacle complet. Vérifier que les chiffres se lisent à 3 m.

- [ ] **Étape 9 : commit**

```bash
git add src
git commit -m "feat: add edition and end screens, wire up App"
```

---

### Tâche 9 : PWA hors-ligne et écran toujours allumé

**Files :**
- Create : `src/state/useWakeLock.ts`, `public/favicon.svg`, `pwa-assets.config.ts`
- Modify : `vite.config.ts`, `src/App.tsx`, `package.json`

**Interfaces :**
- Consumes : `App` (tâche 8)
- Produces : `useWakeLock(active: boolean): void`

- [ ] **Étape 1 : installer**

```bash
pnpm add vite-plugin-pwa@1.3.0 @vite-pwa/assets-generator@2.0.0
```

- [ ] **Étape 2 : créer `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#000"/>
  <circle cx="256" cy="276" r="160" fill="none" stroke="#fff" stroke-width="32"/>
  <path d="M256 276V176M256 276l70 40" stroke="#fff" stroke-width="32" stroke-linecap="round"/>
  <rect x="216" y="60" width="80" height="40" rx="12" fill="#fff"/>
</svg>
```

- [ ] **Étape 3 : générer les icônes**

`pwa-assets.config.ts` :

```ts
import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  images: ["public/favicon.svg"],
  preset: minimal2023Preset,
});
```

Ajouter le script `"generate-pwa-assets": "pwa-assets-generator"` dans `package.json`, puis :

Run : `pnpm generate-pwa-assets`
Expected : `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png` et `public/favicon.ico` créés.

- [ ] **Étape 4 : configurer le plugin dans `vite.config.ts`**

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        background_color: "#000000",
        description: "Timers et trame pour impro longue",
        display: "fullscreen",
        icons: [
          { sizes: "192x192", src: "pwa-192x192.png", type: "image/png" },
          { sizes: "512x512", src: "pwa-512x512.png", type: "image/png" },
          {
            purpose: "maskable",
            sizes: "512x512",
            src: "maskable-icon-512x512.png",
            type: "image/png",
          },
        ],
        lang: "fr",
        name: "ImproLong",
        orientation: "landscape",
        short_name: "ImproLong",
        theme_color: "#000000",
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

`registerType: "autoUpdate"` : une nouvelle version s'installe au prochain chargement avec réseau. Pendant un spectacle il n'y a pas de réseau, donc pas de mise à jour en plein jeu. Et si ça arrivait, l'état est sauvegardé.

- [ ] **Étape 5 : créer `src/state/useWakeLock.ts`**

```ts
import { useEffect } from "react";

/** Empêche la tablette de se mettre en veille tant que `active` est vrai. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
        }
      } catch {
        // Refusé (ex. batterie faible) : l'écran pourra se mettre en veille
      }
    };
    // Android relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [active]);
}
```

- [ ] **Étape 6 : brancher le hook dans `src/App.tsx`**

Ajouter l'import `import { useWakeLock } from "./state/useWakeLock";` et, juste après `useShow` :

```tsx
  useWakeLock(state.phase === "running");
```

- [ ] **Étape 7 : vérifier**

Run : `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected : PASS, et `dist/sw.js` + `dist/manifest.webmanifest` présents.

Run : `pnpm preview`, ouvrir `http://localhost:4173`, DevTools → Application : le manifest est valide, le service worker est actif. Cocher "Offline", recharger : l'app s'affiche.

- [ ] **Étape 8 : commit**

```bash
git add -A
git commit -m "feat: make the app an offline PWA with screen wake lock"
```

- [ ] **Étape 9 : installation sur la tablette (manuel, décision utilisateur)**

Un service worker n'est accepté que sur HTTPS (ou `localhost`). Pour la première installation, publier `dist/` sur un hébergement HTTPS statique, par exemple GitHub Pages. Avec GitHub Pages, ajouter `base: "/improlong/"` dans `vite.config.ts`.

Puis sur la tablette :

1. Ouvrir l'URL dans Chrome, avec le wifi.
2. Menu ⋮ → "Installer l'application".
3. Couper le wifi, lancer ImproLong depuis l'écran d'accueil : l'app s'ouvre.
4. Démarrer un spectacle, laisser la tablette 5 min sans la toucher : l'écran reste allumé.
5. Fermer puis rouvrir l'app : le spectacle reprend là où il en était.
