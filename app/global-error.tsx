"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort error boundary (replaces the root layout when it fails), so it
// cannot rely on the site's CSS — inline styles in the same near-black/red
// language. Its other job is reporting the failure to Sentry.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0d",
          color: "#f2f1ec",
          fontFamily: "system-ui, sans-serif",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <p
            style={{
              color: "#e5322d",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontSize: 13,
              margin: 0,
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: 36,
              textTransform: "uppercase",
              margin: "12px 0 0",
              lineHeight: 1.05,
            }}
          >
            The archive hit a snag
          </h1>
          <p style={{ color: "rgba(242,241,236,0.6)", marginTop: 16 }}>
            This page failed to load. Trying again usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              background: "#e5322d",
              color: "#fff",
              border: 0,
              padding: "12px 24px",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
