import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import CategoryPage from "@/components/CategoryPage";

const CREATORS_DESCRIPTION =
  "SYNDICATE records filed against creator-led teams — opponents who run a YouTube or Instagram channel.";

export const metadata: Metadata = {
  title: "Creators Record",
  description: CREATORS_DESCRIPTION,
  alternates: { canonical: "/creators-record" },
  // This page's own share card (image: the generated creators-record
  // preview next to this file) instead of the site's generic one.
  openGraph: {
    type: "website",
    siteName: "SYNDICATE Achievements",
    title: "Creators Record · SYNDICATE Achievements",
    description: CREATORS_DESCRIPTION,
    url: "/creators-record",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creators Record · SYNDICATE Achievements",
    description: CREATORS_DESCRIPTION,
  },
};

// Same ISR rhythm as the home page; admin edits revalidate on save.
export const revalidate = 60;

export default async function CreatorsRecordPage() {
  const achievements = await getAchievements();
  return <CategoryPage category="CREATOR" achievements={achievements} />;
}
