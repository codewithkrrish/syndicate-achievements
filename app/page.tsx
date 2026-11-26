import { getAchievements } from "@/lib/data";
import PublicSite from "@/components/PublicSite";

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
