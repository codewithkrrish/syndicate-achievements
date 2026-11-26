import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAchievementById } from "@/lib/data";
import { recordLabel } from "@/lib/format";
import type { AchievementFormValues } from "@/lib/types";
import AdminShell from "@/components/admin/AdminShell";
import AchievementForm from "@/components/admin/AchievementForm";

export const metadata: Metadata = { title: "Edit Achievement" };
export const dynamic = "force-dynamic";

export default async function EditAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { id } = await params;
  const achievement = await getAchievementById(Number(id));
  if (!achievement) notFound();

  const initial: AchievementFormValues = {
    matchNumber: achievement.matchNumber,
    opponent: achievement.opponent,
    opponentChannelUrl: achievement.opponentChannelUrl ?? "",
    result: achievement.result,
    category: achievement.category,
    finalScore: achievement.finalScore,
    format: achievement.format,
    date: achievement.date,
    mode: achievement.mode,
    map: achievement.map,
    cardLine: achievement.cardLine,
    thumbnailUrl: achievement.thumbnailUrl ?? "",
    games: achievement.games.map((g) => ({
      scoreFor: g.scoreFor,
      scoreAgainst: g.scoreAgainst,
      result: g.result,
      screenshotUrl: g.screenshotUrl,
    })),
  };

  return (
    <AdminShell active="dashboard">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">
        Editing · {recordLabel(achievement)}
      </p>
      <h1 className="mt-2 font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
        SYNDICATE vs {achievement.opponent}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55">
        Changes go live on the public site the moment they are saved. Game
        rows are saved in the order shown — game numbers follow the rows.
      </p>
      <div className="mt-6">
        <AchievementForm initial={initial} achievementId={achievement.id} />
      </div>
    </AdminShell>
  );
}
