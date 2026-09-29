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
          className="max-w-3xl rounded-xl bg-amber-900 p-6 text-center text-3xl"
          role="alert"
        >
          Passe la tablette en mode avion avant de démarrer : avec du réseau,
          Android peut corriger l'heure en plein spectacle et fausser les
          timers.
        </p>
      )}
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
