// Loading state for the public archive — skeleton in the site's own
// language (dark panels, red pulse) while the record is read from the DB.
export default function Loading() {
  return (
    <main className="min-h-dvh bg-bg px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="h-4 w-40 animate-pulse bg-card" />
        <div className="mt-6 h-16 w-3/4 animate-pulse bg-card sm:h-24" />
        <div className="mt-14 space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex animate-pulse gap-5 border border-line bg-raise p-4"
            >
              <div className="hidden aspect-video w-64 bg-card sm:block" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-6 w-1/2 bg-card" />
                <div className="h-4 w-2/3 bg-card" />
                <div className="h-4 w-1/3 bg-card" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
          Reading the record…
        </p>
      </div>
    </main>
  );
}
