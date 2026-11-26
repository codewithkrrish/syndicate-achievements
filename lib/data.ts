import { prisma } from "./db";
import type { AchievementDTO } from "./types";

// Read paths for the public site and the admin panel. Every function is
// failure-tolerant: if the database is unreachable (e.g. during a build on
// a machine without DATABASE_URL, or a cold deploy before migrations run),
// the site renders its polished empty state instead of crashing.

function toDTO(a: {
  id: number;
  matchNumber: number;
  opponent: string;
  opponentChannelUrl: string | null;
  result: string;
  category: string;
  finalScore: string;
  format: string;
  date: Date;
  mode: string;
  map: string;
  cardLine: string;
  thumbnailUrl: string | null;
  games: {
    id: number;
    gameNumber: number;
    scoreFor: number;
    scoreAgainst: number;
    result: string;
    screenshotUrl: string;
  }[];
}): AchievementDTO {
  return {
    id: a.id,
    matchNumber: a.matchNumber,
    opponent: a.opponent,
    opponentChannelUrl: a.opponentChannelUrl,
    result: a.result,
    category: a.category,
    finalScore: a.finalScore,
    format: a.format,
    // @db.Date comes back at UTC midnight; slicing the ISO string keeps the
    // calendar day stable in every timezone.
    date: a.date.toISOString().slice(0, 10),
    mode: a.mode,
    map: a.map,
    cardLine: a.cardLine,
    thumbnailUrl: a.thumbnailUrl,
    games: [...a.games]
      .sort((x, y) => x.gameNumber - y.gameNumber)
      .map((g) => ({ ...g })),
  };
}

const includeGames = { games: true } as const;

/** All achievements, newest match first — the public record + admin list. */
export async function getAchievements(): Promise<AchievementDTO[]> {
  try {
    const rows = await prisma.achievement.findMany({
      include: includeGames,
      orderBy: { matchNumber: "desc" },
    });
    return rows.map(toDTO);
  } catch (err) {
    console.error("[data] getAchievements failed:", err);
    return [];
  }
}

export async function getAchievementById(
  id: number,
): Promise<AchievementDTO | null> {
  try {
    const row = await prisma.achievement.findUnique({
      where: { id },
      include: includeGames,
    });
    return row ? toDTO(row) : null;
  } catch (err) {
    console.error("[data] getAchievementById failed:", err);
    return null;
  }
}

export interface AdminStats {
  totalAchievements: number;
  wins: number;
  losses: number;
  totalGames: number;
  totalScreenshots: number;
}

/** Dashboard counters. Screenshots == game rows (one screenshot per game). */
export async function getAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    totalAchievements: 0,
    wins: 0,
    losses: 0,
    totalGames: 0,
    totalScreenshots: 0,
  };
  try {
    const [totalAchievements, wins, losses, totalGames] = await Promise.all([
      prisma.achievement.count(),
      prisma.achievement.count({ where: { result: "WIN" } }),
      prisma.achievement.count({ where: { result: "LOSS" } }),
      prisma.game.count(),
    ]);
    return {
      totalAchievements,
      wins,
      losses,
      totalGames,
      totalScreenshots: totalGames,
    };
  } catch (err) {
    console.error("[data] getAdminStats failed:", err);
    return empty;
  }
}

/** The screenshot used as a record card's thumbnail lives in lib/format.ts
 *  (client-safe). This module stays server-only because it imports Prisma. */
export { thumbnailOf, formatDate, matchLabel } from "./format";
