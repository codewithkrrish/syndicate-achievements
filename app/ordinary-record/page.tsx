import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import CategoryPage from "@/components/CategoryPage";

const ORDINARY_DESCRIPTION =
  "SYNDICATE records filed against regular in-game guilds.";

export const metadata: Metadata = {
  title: "Ordinary Record",
  description: ORDINARY_DESCRIPTION,
  alternates: { canonical: "/ordinary-record" },
  // This page's own share card (image: the generated ordinary-record
  // preview next to this file) instead of the site's generic one.
  openGraph: {
    type: "website",
    siteName: "SYNDICATE Achievements",
    title: "Ordinary Record · SYNDICATE Achievements",
    description: ORDINARY_DESCRIPTION,
    url: "/ordinary-record",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ordinary Record · SYNDICATE Achievements",
    description: ORDINARY_DESCRIPTION,
  },
};

// Same ISR rhythm as the home page; admin edits revalidate on save.
export const revalidate = 60;

export default async function OrdinaryRecordPage() {
  const achievements = await getAchievements();
  return <CategoryPage category="ORDINARY" achievements={achievements} />;
}
