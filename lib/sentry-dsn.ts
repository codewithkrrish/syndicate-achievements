// Sentry DSN for the "syndicate-achievements" project (org: codeiwithkrrish).
// A DSN is a public ingestion key by design — it only allows SENDING error
// events to this project, never reading them — so it is safe to keep in the
// repo. It can still be overridden per-environment with NEXT_PUBLIC_SENTRY_DSN
// (set the same name in the host's env settings if the project ever moves).
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  "https://91a5c78d5f36c8bda85be42a86cda211@o4512136254586880.ingest.de.sentry.io/4512500579500112";
