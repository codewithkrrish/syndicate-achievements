import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "./lib/sentry-dsn";

// Edge-runtime Sentry: error events only, same posture as the server config.
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0,
});
