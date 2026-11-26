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
      // Match numbers repeat across records now (each record numbers
      // its own matches from #001), so "newest first" is by date; the
      // number and id only break ties deterministically.
      orderBy: [{ date: "desc" }, { matchNumber: "desc" }, { id: "desc" }],
    });
    return rows.map(toDTO);
  } catch (err) {
    console.error("[data] getAchievements failed:", err);
    return [];
  }
}

/**
 * The next free match number in each record — numbering is scoped per
 * record (max filed number in that record + 1), never global. Used to
 * prefill the admin create form.
 */
export async function getNextMatchNumbers(): Promise<{
  CREATOR: number;
  ORDINARY: number;
}> {
  const next = { CREATOR: 1, ORDINARY: 1 };
  try {
    const grouped = await prisma.achievement.groupBy({
      by: ["category"],
      _max: { matchNumber: true },
    });
    for (const g of grouped) {
      const n = (g._max.matchNumber ?? 0) + 1;
      if (g.category === "CREATOR") next.CREATOR = n;
      else next.ORDINARY = n;
    }
  } catch (err) {
    console.error("[data] getNextMatchNumbers failed:", err);
  }
  return next;
}

/**
 * One record by its public identity — category + per-record match
 * number. Powers the shareable detail routes (/creators-record/001).
 * Follows the site's filing rule: anything not filed as CREATOR reads
 * as Ordinary.
 */
export async function getAchievementByCategoryNumber(
  category: "CREATOR" | "ORDINARY",
  matchNumber: number,
): Promise<AchievementDTO | null> {
  try {
    const row = await prisma.achievement.findFirst({
      where:
        category === "CREATOR"
          ? { category: "CREATOR", matchNumber }
          : { matchNumber, NOT: { category: "CREATOR" } },
      include: includeGames,
    });
    return row ? toDTO(row) : null;
  } catch (err) {
    console.error("[data] getAchievementByCategoryNumber failed:", err);
    return null;
  }
}

/** Every filed (category, matchNumber) pair — sitemap + static params. */
export async function getRecordIndex(): Promise<
  { category: string; matchNumber: number }[]
> {
  try {
    return await prisma.achievement.findMany({
      select: { category: true, matchNumber: true },
      orderBy: [{ category: "asc" }, { matchNumber: "asc" }],
    });
  } catch (err) {
    console.error("[data] getRecordIndex failed:", err);
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
export { thumbnailOf, formatDate, matchLabel, recordLabel } from "./format";
