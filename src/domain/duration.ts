import { milliseconds } from "date-fns";

// date-fns sait convertir une durée mais pas lire une chaîne ISO 8601 : on extrait les composantes ici
const ISO_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

/**
Convertit une durée ISO 8601 limitée à heures/minutes/secondes (ex. `PT5M`) en millisecondes.
*/
export function parseIsoDuration(value: string): number {
  const match = ISO_DURATION.exec(value);
  if (match === null || value === "PT") {
    throw new Error(`Durée ISO 8601 invalide : "${value}"`);
  }
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return milliseconds({
    hours: Number(hours),
    minutes: Number(minutes),
    seconds: Number(seconds),
  });
}
