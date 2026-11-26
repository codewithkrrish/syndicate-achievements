import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "./lib/sentry-dsn";

// Browser Sentry: error events only. No tracing, no session replay
// integration at all, no default PII.
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
