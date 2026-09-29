export function PreparationScreen({
  onStart,
}: {
  readonly onStart: () => void;
}) {
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
