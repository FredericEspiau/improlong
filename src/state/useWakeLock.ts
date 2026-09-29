import { useEffect } from "react";

/**
Empêche la tablette de se mettre en veille tant que `active` est vrai.
*/
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) {
      return;
    }
    let sentinel: null | WakeLockSentinel = null;
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
