import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import { OG_IMAGE_ORIGIN } from "@/lib/site";
import PublicSite from "@/components/PublicSite";

// The home page's own share card: its title and description, with the
// generated preview image from app/opengraph-image.tsx (the layout's
// generic hero image stays as the fallback for routes without one).
const HOME_DESCRIPTION =
  "The official achievement archive of the SYNDICATE Free Fire guild — every guild-vs-guild match on record, with scores and screenshots for every game.";

export const metadata: Metadata = {
  openGraph: {
    type: "website",
    siteName: "SYNDICATE Achievements",
    title: "SYNDICATE Achievements — Official Match Archive",
    description: HOME_DESCRIPTION,
    url: "/",
    // Absolute image URL on the serving origin — see OG_IMAGE_ORIGIN.
    images: [
      {
        url: `${OG_IMAGE_ORIGIN}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "SYNDICATE Achievements — Official Match Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNDICATE Achievements — Official Match Archive",
    description: HOME_DESCRIPTION,
    images: [`${OG_IMAGE_ORIGIN}/twitter-image`],
  },
};

// The archive is cached and revalidated at most every 60 seconds (ISR).
// Admin edits call revalidatePath("/") (see app/admin/actions.ts), so an
// edit still appears the moment it is saved, while repeat visits in
// between skip the database entirely.
export const revalidate = 60;

// Structured data for the archive itself, so search engines can name
// and describe the site correctly in results.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SYNDICATE Achievements",
  alternateName: "SYNDICATE — Official Match Archive",
  url: "https://syndicate.run.place/",
  description:
    "The official achievement archive of the SYNDICATE Free Fire guild — every guild-vs-guild match on record, with scores and screenshots for every game.",
  about: {
    "@type": "Organization",
    name: "SYNDICATE",
    description: "Free Fire guild — guild-vs-guild match archive.",
  },
};

export default async function HomePage() {
  const achievements = await getAchievements();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <PublicSite achievements={achievements} />
    </>
  );
}
