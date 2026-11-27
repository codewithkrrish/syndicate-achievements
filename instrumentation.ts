import * as Sentry from "@sentry/nextjs";

// Next.js instrumentation hook: load the server Sentry config when the
// Node.js runtime starts, and forward route-handler errors to Sentry.
//
// There is deliberately no edge branch: the only edge code on this site
// is the Auth.js middleware, and bundling the Sentry edge SDK into
// Netlify's Deno-based edge functions is the prime suspect for the
// Netlify build failures that began with the Sentry commit (Vercel and
// local builds were unaffected). Server-side + browser coverage stays;
// middleware errors are the only blind spot, and the middleware is a
// thin auth gate whose failures surface as login problems, not silence.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
