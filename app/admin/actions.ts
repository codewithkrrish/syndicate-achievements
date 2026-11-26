"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
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

function refreshPublicSite() {
  // The public archive is force-dynamic, so this is belt-and-braces: any
  // statically-cached fragment anywhere is dropped the moment data changes.
  revalidatePath("/");
  revalidatePath("/admin");
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
    refreshPublicSite();
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
    refreshPublicSite();
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
  try {
    // Games cascade-delete with the achievement (schema onDelete: Cascade).
    await prisma.achievement.delete({ where: { id } });
    refreshPublicSite();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, formError: friendlyDbError(err) };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
