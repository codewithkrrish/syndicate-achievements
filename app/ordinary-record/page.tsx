import type { Metadata } from "next";
import { getAchievements } from "@/lib/data";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Ordinary Record",
  description:
    "SYNDICATE records filed against regular in-game guilds.",
  alternates: { canonical: "/ordinary-record" },
};

// Same ISR rhythm as the home page; admin edits revalidate on save.
export const revalidate = 60;

export default async function OrdinaryRecordPage() {
  const achievements = await getAchievements();
  return <CategoryPage category="ORDINARY" achievements={achievements} />;
}
