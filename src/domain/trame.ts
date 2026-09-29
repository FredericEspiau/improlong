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

/**
Valide la trame brute (JSON) et la convertit en millisecondes.
*/
export function parseTrame(raw: unknown): Trame {
  if (!isRecord(raw) || !Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw new Error("Trame invalide : il faut au moins une scène");
  }
  const rawScenes: ReadonlyArray<unknown> = raw.scenes;
  const scenes = rawScenes.map((scene, index) => parseScene(scene, index));
  const totalMs = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  return { scenes, totalMs };
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
    throw new Error(
      `Scène ${String(position)} invalide : il faut "name" et "duration"`,
    );
  }
  const durationMs = parseIsoDuration(raw.duration);
  if (durationMs <= 0) {
    throw new Error(`Scène ${String(position)} : la durée doit être positive`);
  }
  return { durationMs, name: raw.name };
}

export const trame: Trame = parseTrame(rawTrame);
