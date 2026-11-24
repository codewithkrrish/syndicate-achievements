import type { Metadata } from "next";

// The whole admin area is noindex/nofollow (robots.ts also disallows it).
// Individual admin pages do their own session checks; this layout only
// provides the metadata and a neutral frame — the login page and the
// signed-in pages style themselves.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-bg text-ink">{children}</div>;
}
