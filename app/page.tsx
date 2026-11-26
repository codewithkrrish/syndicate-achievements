import { getAchievements } from "@/lib/data";
import PublicSite from "@/components/PublicSite";

// The archive is cached and revalidated at most every 60 seconds (ISR).
// Admin edits call revalidatePath("/") (see app/admin/actions.ts), so an
// edit still appears the moment it is saved, while repeat visits in
// between skip the database entirely.
export const revalidate = 60;

export default async function HomePage() {
  const achievements = await getAchievements();
  return <PublicSite achievements={achievements} />;
}
