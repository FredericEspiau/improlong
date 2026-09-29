import { useOnline } from "../state/useOnline";

export function PreparationScreen({
  onStart,
}: {
  readonly onStart: () => void;
}) {
  const online = useOnline();

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-10 p-8">
      {online && (
        <p
          className="max-w-3xl rounded-xl border-4 border-warn bg-surface p-6 text-center text-3xl"
          role="alert"
        >
          Passe la tablette en mode avion avant de démarrer : avec du réseau,
          Android peut corriger l'heure en plein spectacle et fausser les
          timers.
        </p>
      )}
      <button
        className="rounded-2xl bg-ok px-16 py-10 text-6xl font-bold text-background active:brightness-90"
        onClick={onStart}
        type="button"
      >
        Démarrer
      </button>
    </main>
  );
}
