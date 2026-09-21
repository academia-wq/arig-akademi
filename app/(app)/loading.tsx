export default function AppLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Ачаалж байна">
      <div className="h-24 rounded-xl bg-ink/5" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-ink/5" />
        <div className="h-28 rounded-2xl bg-ink/5" />
        <div className="h-28 rounded-2xl bg-ink/5" />
      </div>
      <div className="mt-6 h-64 rounded-2xl bg-ink/5" />
    </div>
  );
}
