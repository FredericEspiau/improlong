import { useEffect, useState } from "react";

/**
Heure courante, rafraîchie régulièrement pour faire avancer les timers à l'écran.
*/
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
