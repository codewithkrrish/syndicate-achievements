import type { AchievementDTO } from "./types";

// Pure presentation helpers — safe to import from client components
// (no database code lives here).

/**
 * The image used as a record card's thumbnail: the achievement's poster
 * thumbnail when one is set, otherwise the decider (last game) screenshot.
 */
export function thumbnailOf(a: AchievementDTO): string | null {
  if (a.thumbnailUrl) return a.thumbnailUrl;
  if (a.games.length === 0) return null;
  return a.games[a.games.length - 1].screenshotUrl;
}

/** "2026-08-08" -> "8 Aug 2026" (short) or "8 August 2026" (long). */
export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: style === "short" ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** 2 -> "#002" for match labels. */
export function matchLabel(matchNumber: number): string {
  return `#${String(matchNumber).padStart(3, "0")}`;
}

/** 2 -> "002" (bare number, used in eyebrows). */
export function matchNumberPadded(matchNumber: number): string {
  return String(matchNumber).padStart(3, "0");
}

/**
 * Category-scoped match label — each record numbers its own matches
 * from #001, so a bare number is never enough to identify a match:
 * "Creators Record #001" / "Ordinary Record #001". Anything not filed
 * as CREATOR reads as Ordinary, the same rule the collections use.
 */
export function recordLabel(a: {
  category: string;
  matchNumber: number;
}): string {
  const record = a.category === "CREATOR" ? "Creators" : "Ordinary";
  return `${record} Record ${matchLabel(a.matchNumber)}`;
}

/**
 * Category-scoped hash slug for a match detail deep link:
 * "#creators-001" / "#ordinary-001". Numbers repeat across records,
 * so the slug has to carry the record too.
 */
export function matchHash(a: {
  category: string;
  matchNumber: number;
}): string {
  const record = a.category === "CREATOR" ? "creators" : "ordinary";
  return `#${record}-${matchNumberPadded(a.matchNumber)}`;
}
