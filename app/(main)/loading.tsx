export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5" aria-busy="true" aria-label="Loading">
      <div className="mb-5 h-10 w-40 animate-pulse rounded-full bg-ink/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sketch aspect-[4/6] animate-pulse bg-paper-2" />
        ))}
      </div>
    </div>
  );
}
