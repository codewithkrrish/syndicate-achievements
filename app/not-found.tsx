import Link from "next/link";

// 404 in the same design language as the rest of the site.
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-5">
      <div className="bg-glow bg-glow-a" aria-hidden />
      <div className="relative text-center">
        <p className="font-mono text-sm tracking-[0.3em] text-brand">404</p>
        <h1 className="mt-3 font-condensed text-5xl font-bold uppercase leading-none sm:text-6xl">
          Nothing on record
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-ink/60">
          This page is not in the archive. The record only holds filed
          achievements — head back and pick one from the list.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center border border-linestrong px-6 font-condensed text-lg font-semibold uppercase tracking-wider text-ink transition hover:border-brand hover:text-brand"
        >
          Back to the record
        </Link>
      </div>
    </main>
  );
}
