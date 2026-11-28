import type { NextConfig } from "next";

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
    // admins may paste external screenshot URLs into a record.
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Client router cache: a page the visitor has already opened is
    // kept for a minute, so going back and forth between the archive
    // and a match is instant instead of a fresh server round-trip
    // every tap. 60s matches the public pages' own revalidation
    // rhythm — nothing on this site changes faster than that outside
    // the admin panel, and admin actions invalidate the cache anyway.
    staleTimes: { dynamic: 60, static: 300 },
  },
  images: {
    // Cap the generated variants at 1920w: the defaults run to 3840w,
    // and transcoding a near-4K variant from a database-stored source is
    // the slowest, most failure-prone first load on the site (the inline
    // views never display wider than ~1152px, and the lightbox opens the
    // original full-size file, so nothing visible is lost).
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
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

// No Sentry in the build right now — deliberately. The Sentry
// integration (commit 6b8bf456) coincided exactly with Netlify builds
// stopping: production stayed pinned at the pre-Sentry commit while
// Vercel and local builds passed, and removing the build-plugin
// wrapper and then the edge config did not unstick it. With no access
// to Netlify's build logs from here, the whole SDK was removed so
// production could ship; the Sentry project itself still exists
// (project "syndicate-achievements") and the full integration is
// preserved in git history at 6b8bf456. To retry:
// re-add it while watching a Netlify build log, one piece at a time.
export default nextConfig;
