import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAchievementById } from "@/lib/data";
import { formatDate, matchLabel, thumbnailOf } from "@/lib/format";
import AdminShell from "@/components/admin/AdminShell";
import DeleteConfirm from "@/components/admin/DeleteConfirm";

export const metadata: Metadata = { title: "Delete Achievement" };
export const dynamic = "force-dynamic";

// Delete flow, step 1: show the full record that is about to be removed —
// thumbnail, scoreline, spec summary, every game — so the confirmation is
// a decision about a specific achievement, never a blind click.
export default async function DeleteAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { id } = await params;
  const a = await getAchievementById(Number(id));
  if (!a) notFound();

  const thumb = thumbnailOf(a);

  return (
    <AdminShell active="dashboard">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">
        Delete · Match {matchLabel(a.matchNumber)}
      </p>
      <h1 className="mt-2 font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
        Remove this achievement?
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55">
        Check the record below carefully. Deleting removes it from the public
        site immediately, along with every game and screenshot in the series.
      </p>

      <article className="mt-7 border border-line bg-raise">
        <div className="flex flex-col sm:flex-row">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt="Deciding game screenshot"
              className="aspect-video w-full shrink-0 border-b border-line object-cover sm:w-80 sm:border-b-0 sm:border-r"
            />
          )}
          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
              Match {matchLabel(a.matchNumber)} · {formatDate(a.date, "long")}
            </p>
            <h2 className="mt-1.5 font-condensed text-3xl font-bold uppercase leading-tight">
              SYNDICATE vs {a.opponent}
            </h2>
            <p className="mt-1 text-[15px] text-ink/65">{a.cardLine}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-3">
              <Item label="Result" value={`${a.result} — ${a.finalScore}`} />
              <Item label="Format" value={a.format} />
              <Item label="Mode" value={a.mode} />
              <Item label="Map" value={a.map} />
              <Item label="Games" value={String(a.games.length)} />
              <Item
                label="Opponent channel"
                value={a.opponentChannelUrl ? "On file" : "None"}
              />
            </dl>
          </div>
        </div>
        <ul className="divide-y divide-line border-t border-line">
          {a.games.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
            >
              <span className="font-condensed text-lg font-bold uppercase">
                Game {g.gameNumber}
              </span>
              <span
                className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-white ${
                  g.result === "Victory" ? "bg-brand" : "bg-zinc-600"
                }`}
              >
                {g.result}
              </span>
              <span className="font-mono text-xs text-ink/55">
                {g.scoreFor} – {g.scoreAgainst}
              </span>
              <span className="ml-auto max-w-full truncate font-mono text-[11px] text-ink/40">
                {g.screenshotUrl}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <div className="mt-7">
        <DeleteConfirm id={a.id} />
      </div>
    </AdminShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-ink/90">{value}</dd>
    </div>
  );
}
