import { useSyncExternalStore } from "react";

/**
Vrai si la tablette a une connexion réseau. Une page web ne peut pas lire le réglage
« mode avion », mais sans réseau Android ne peut pas corriger l'heure : c'est ce qui compte.
*/
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}

function subscribe(onChange: () => void): () => void {
  addEventListener("online", onChange);
  addEventListener("offline", onChange);
  return () => {
    removeEventListener("online", onChange);
    removeEventListener("offline", onChange);
  };
}
