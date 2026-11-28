"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { detailPath } from "@/lib/format";
import {
  achievementInputSchema,
  fieldErrors,
} from "@/lib/validation";

// Every mutation in the admin panel funnels through this file, and every
// action re-verifies the session server-side before touching the database.
// Middleware is layer 1; this is layer 2. An action invoked directly
// (bypassing the UI entirely) with no valid session gets nothing.

export interface ActionResult {
  ok: boolean;
  id?: number;
  errors?: Record<string, string>;
  formError?: string;
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

function refreshPublicSite(
  affected: { category: string; matchNumber: number }[] = [],
) {
  // Every public surface that renders record data is ISR-cached for 60s;
  // a mutation drops them all on demand so the change is visible the
  // moment it is saved: home (stats, ticker, summaries), both collection
  // pages, the standalone match pages for every affected record (old AND
  // new identity when a record moves), and the sitemap.
  revalidatePath("/");
  revalidatePath("/creators-record");
  revalidatePath("/ordinary-record");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  for (const a of affected) {
    revalidatePath(detailPath(a));
  }
}

/** "/api/images/<id>" -> "<id>"; any other URL -> null. */
function storedImageId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^\/api\/images\/([^/?#]+)$/);
  return m ? m[1] : null;
}

/**
 * Delete StoredImage rows whose URLs are no longer referenced by ANY
 * game screenshot or poster thumbnail. Called after a mutation with the
 * URLs that mutation may have orphaned (replaced/removed screenshots,
 * a deleted record's images). Reference counting happens against the
 * post-mutation database, so an image shared by two records is only
 * removed when the last reference goes. Failures are logged, never
 * fatal — a leftover row is harmless, a failed save is not.
 */
async function cleanupStoredImages(urls: (string | null | undefined)[]) {
  const ids = new Map<string, string>(); // id -> url
  for (const u of urls) {
    const id = storedImageId(u);
    if (id && u) ids.set(id, u);
  }
  for (const [id, url] of ids) {
    try {
      const [games, thumbs] = await Promise.all([
        prisma.game.count({ where: { screenshotUrl: url } }),
        prisma.achievement.count({ where: { thumbnailUrl: url } }),
      ]);
      if (games === 0 && thumbs === 0) {
        await prisma.storedImage.delete({ where: { id } });
      }
    } catch (err) {
      console.error("[admin action] StoredImage cleanup failed:", err);
    }
  }
}

function friendlyDbError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return "That match number is already on file in this record. Each record numbers its own matches — pick the next free number in this record.";
    }
    if (err.code === "P2025") {
      return "That achievement no longer exists. It may already have been deleted.";
    }
  }
  console.error("[admin action] DB error:", err);
  return "Something went wrong on the server. Nothing was saved — try again.";
}

export async function createAchievement(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, formError: "Unauthorized" };

  const parsed = achievementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  try {
    const created = await prisma.achievement.create({
      data: {
        matchNumber: data.matchNumber,
        opponent: data.opponent,
        opponentChannelUrl: data.opponentChannelUrl,
        opponentDiscordUrl: data.opponentDiscordUrl,
        result: data.result,
        category: data.category,
        finalScore: data.finalScore,
        format: data.format,
        date: data.date,
        mode: data.mode,
        map: data.map,
        cardLine: data.cardLine,
        thumbnailUrl: data.thumbnailUrl,
        games: {
          create: data.games.map((g, i) => ({
            gameNumber: i + 1,
            scoreFor: g.scoreFor,
            scoreAgainst: g.scoreAgainst,
            result: g.result,
            screenshotUrl: g.screenshotUrl,
          })),
        },
      },
    });
    refreshPublicSite([
      { category: created.category, matchNumber: created.matchNumber },
    ]);
    return { ok: true, id: created.id };
  } catch (err) {
    return { ok: false, formError: friendlyDbError(err) };
  }
}

export async function updateAchievement(
  id: number,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, formError: "Unauthorized" };
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, formError: "Invalid achievement id." };
  }

  const parsed = achievementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // The record's current identity + image URLs, captured before the
  // write: the old standalone page must be revalidated too when the
  // record moves, and replaced screenshots orphan their StoredImages.
  const before = await prisma.achievement.findUnique({
    where: { id },
    select: {
      category: true,
      matchNumber: true,
      thumbnailUrl: true,
      games: { select: { screenshotUrl: true } },
    },
  });

  try {
    // Replace the game set wholesale: simpler and safer than diffing rows,
    // and the cascade keeps orphans impossible.
    await prisma.$transaction([
      prisma.game.deleteMany({ where: { achievementId: id } }),
      prisma.achievement.update({
        where: { id },
        data: {
          matchNumber: data.matchNumber,
          opponent: data.opponent,
          opponentChannelUrl: data.opponentChannelUrl,
          opponentDiscordUrl: data.opponentDiscordUrl,
          result: data.result,
          category: data.category,
          finalScore: data.finalScore,
          format: data.format,
          date: data.date,
          mode: data.mode,
          map: data.map,
          cardLine: data.cardLine,
          thumbnailUrl: data.thumbnailUrl,
          games: {
            create: data.games.map((g, i) => ({
              gameNumber: i + 1,
              scoreFor: g.scoreFor,
              scoreAgainst: g.scoreAgainst,
              result: g.result,
              screenshotUrl: g.screenshotUrl,
            })),
          },
        },
      }),
    ]);
    refreshPublicSite([
      ...(before
        ? [{ category: before.category, matchNumber: before.matchNumber }]
        : []),
      { category: data.category, matchNumber: data.matchNumber },
    ]);
    if (before) {
      await cleanupStoredImages([
        before.thumbnailUrl,
        ...before.games.map((g) => g.screenshotUrl),
      ]);
    }
    return { ok: true, id };
  } catch (err) {
    return { ok: false, formError: friendlyDbError(err) };
  }
}

export async function deleteAchievement(id: number): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, formError: "Unauthorized" };
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, formError: "Invalid achievement id." };
  }
  // Capture the record's identity + image URLs first: after the delete
  // they are gone, and both the revalidation and the StoredImage cleanup
  // need them.
  const before = await prisma.achievement.findUnique({
    where: { id },
    select: {
      category: true,
      matchNumber: true,
      thumbnailUrl: true,
      games: { select: { screenshotUrl: true } },
    },
  });
  try {
    // Games cascade-delete with the achievement (schema onDelete: Cascade).
    await prisma.achievement.delete({ where: { id } });
    refreshPublicSite(
      before
        ? [{ category: before.category, matchNumber: before.matchNumber }]
        : [],
    );
    if (before) {
      await cleanupStoredImages([
        before.thumbnailUrl,
        ...before.games.map((g) => g.screenshotUrl),
      ]);
    }
    return { ok: true, id };
  } catch (err) {
    return { ok: false, formError: friendlyDbError(err) };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
