import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Creators Record",
  description:
    "SYNDICATE records filed against creator-led teams — opponents who run a YouTube or Instagram channel.",
  alternates: { canonical: "/creators-record" },
};

// Same ISR rhythm as the home page; admin edits revalidate on save.
export const revalidate = 60;

export default async function CreatorsRecordPage() {
  const achievements = await getAchievements();
  return <CategoryPage category="CREATOR" achievements={achievements} />;
}
