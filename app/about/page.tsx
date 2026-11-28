import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import StandaloneAbout from "@/components/StandaloneAbout";

// About the guild, on its own page: /about. It used to be an in-page
// view on the home page under a #about hash; Krrish wanted no "#" in
// any URL, so About is a route like every other page — clean to look
// at, and shareable with its own preview (opengraph-image.tsx here).
const ABOUT_DESCRIPTION =
  "About SYNDICATE — the Free Fire guild behind the record: its owners, its official casters, and the official community links.";

export const metadata: Metadata = {
  title: "About Us",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: "SYNDICATE Achievements",
    title: "About Us · SYNDICATE Achievements",
    description: ABOUT_DESCRIPTION,
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us · SYNDICATE Achievements",
    description: ABOUT_DESCRIPTION,
  },
};

// Same ISR rhythm as the other public pages.
export const revalidate = 60;

export default async function AboutPage() {
  const achievements = await getAchievements();
  return <StandaloneAbout achievements={achievements} />;
}
