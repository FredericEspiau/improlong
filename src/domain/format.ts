/**
Horloge `m:ss` ou `h:mm:ss`, préfixée par `-` si négative. Arrondit à la seconde inférieure (temps écoulé).
*/
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  return ms < 0 && totalSeconds > 0
    ? `-${clockBody(totalSeconds)}`
    : clockBody(totalSeconds);
}

/**
Compte à rebours : arrondit à la seconde supérieure, comme un minuteur.
Une scène de 5 min affiche 5:00 au départ, et le `-` apparaît dès le premier instant de dépassement.
*/
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(Math.abs(ms) / 1000);
  return ms < 0 ? `-${clockBody(totalSeconds)}` : clockBody(totalSeconds);
}

/**
Glissement lisible : `+30 s` (avance), `-1 min 12 s` (retard), `null` si nul.
*/
export function formatDrift(ms: number): null | string {
  const totalSeconds = Math.round(Math.abs(ms) / 1000);
  if (totalSeconds === 0) {
    return null;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    minutes > 0 ? `${String(minutes)} min` : "",
    seconds > 0 ? `${String(seconds)} s` : "",
  ];
  const sign = ms > 0 ? "+" : "-";
  return `${sign}${parts.filter((part) => part !== "").join(" ")}`;
}

function clockBody(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${String(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
