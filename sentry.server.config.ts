import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "./lib/sentry-dsn";

// Server-side Sentry: error events only. No performance tracing
// (tracesSampleRate 0), no session replay, no default PII.
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0,
});
