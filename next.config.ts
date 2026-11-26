import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Security headers applied to every response. The admin area additionally
// gets X-Robots-Tag via the route metadata + robots.ts, and is never linked
// from the public UI.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Content-Security-Policy. script-src/style-src keep 'unsafe-inline'
    // because Next injects inline runtime/style tags (there is no nonce
    // setup); fonts load from Google Fonts; img-src allows https: because
    // admins may paste external screenshot URLs into a record. connect-src
    // additionally allows the Sentry ingest host so browser error reports
    // can leave the page.
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://o4512136254586880.ingest.de.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Screenshots are served from the DB route (/api/images, same-origin)
    // or pasted by the admin as external https URLs; the optimizer must
    // accept both, so any https host is allowed (records are written by
    // the single trusted admin, and the CSP already permits https: imgs).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Seed artwork and the guild logo change only via a redeploy, so
        // browsers may keep them briefly — repeat visits skip re-downloading
        // the heavy images, and stale-while-revalidate keeps a swapped
        // screenshot from sticking around.
        source: "/seed/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/guild-logo.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

// Sentry wrapping: build-time only (component annotations + build plugin).
// Source-map upload is disabled — no SENTRY_AUTH_TOKEN is kept anywhere for
// this project; error events still report with full server-side context.
export default withSentryConfig(nextConfig, {
  org: "codeiwithkrrish",
  project: "syndicate-achievements",
  silent: true,
  sourcemaps: { disable: true },
});
