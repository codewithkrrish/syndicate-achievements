"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

// Branded error boundary in the same design language as not-found.tsx:
// near-black ground, one red glow, mono eyebrow, condensed display type.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-5">
      <div className="bg-glow bg-glow-a" aria-hidden />
      <div className="relative text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-brand">
          Something went wrong
        </p>
        <h1 className="mt-3 font-condensed text-5xl font-bold uppercase leading-none sm:text-6xl">
          The archive hit a snag
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-ink/60">
          This page failed to load. Trying again usually fixes it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center bg-brand px-6 font-condensed text-lg font-semibold uppercase tracking-wider text-white transition hover:bg-branddeep"
          >
            Try again
          </button>
          <Link
            href="/"
            className="font-condensed text-lg font-semibold uppercase tracking-wider text-ink/60 transition hover:text-ink"
          >
            Back to the archive
          </Link>
        </div>
      </div>
    </main>
  );
}
