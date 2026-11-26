import type { Metadata, Viewport } from "next";
import "./globals.css";

// Phone browser chrome matches the site's near-black background instead of
// flashing white while the page loads.
export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export const metadata: Metadata = {
  title: {
    default: "SYNDICATE Achievements — Official Match Archive",
    template: "%s · SYNDICATE Achievements",
  },
  description:
    "The official achievement archive of the SYNDICATE Free Fire guild — every guild-vs-guild series on record, with scores and screenshots for every game.",
  // The admin area carries its own noindex metadata; the public archive is
  // fine to index, but nothing here opts into anything beyond the basics.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fonts are loaded at runtime (not via next/font) so `next build`
            never depends on reaching Google Fonts — the build stays green
            on any machine, and the page falls back to system sans cleanly. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
