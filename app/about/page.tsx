import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import { OG_IMAGE_ORIGIN } from "@/lib/site";
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
    // Absolute image URL on the serving origin — see OG_IMAGE_ORIGIN.
    images: [
      {
        url: `${OG_IMAGE_ORIGIN}/about/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "About Us · SYNDICATE Achievements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us · SYNDICATE Achievements",
    description: ABOUT_DESCRIPTION,
    images: [`${OG_IMAGE_ORIGIN}/about/twitter-image`],
  },
};

// Same ISR rhythm as the other public pages.
export const revalidate = 60;

export default async function AboutPage() {
  const achievements = await getAchievements();
  return <StandaloneAbout achievements={achievements} />;
}
