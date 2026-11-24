import { getAchievements } from "@/lib/data";
import PublicSite from "@/components/PublicSite";

// The archive is read from the database on every request: an admin edit is
// live the moment it is saved, with no rebuild and no cache to clear.
// force-dynamic also keeps `next build` independent of a live database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const achievements = await getAchievements();
  return <PublicSite achievements={achievements} />;
}
