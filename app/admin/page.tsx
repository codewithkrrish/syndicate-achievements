import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAchievements, getAdminStats } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import AchievementList from "@/components/admin/AchievementList";
import NoticeBanner from "@/components/admin/NoticeBanner";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

// Admin dashboard: archive counters, quick actions, and the full
// achievement list with search/filter. Session is verified here on the
// server even though middleware already guards the route (defense in depth).
export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [stats, achievements] = await Promise.all([
    getAdminStats(),
    getAchievements(),
  ]);

  return (
    <AdminShell active="dashboard">
      <Suspense fallback={null}>
        <NoticeBanner />
      </Suspense>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            Signed in as {session.user.name ?? "admin"}. Everything saved here
            is published to the public site immediately.
          </p>
        </div>
        <Link
          href="/admin/achievements/new"
          className="inline-flex min-h-12 items-center bg-brand px-6 font-condensed text-lg font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:ml-auto"
        >
          + Add achievement
        </Link>
      </div>

      {/* Overview counters */}
      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Achievements" value={stats.totalAchievements} />
        <Stat label="Wins" value={stats.wins} accent />
        <Stat label="Losses" value={stats.losses} />
        <Stat label="Games on file" value={stats.totalGames} />
        <Stat label="Screenshots" value={stats.totalScreenshots} />
      </dl>

      {/* Quick links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickLink
          href="/admin/achievements/new"
          title="Add a win"
          note="File a new series into the record with its screenshots."
        />
        <QuickLink
          href="/#about"
          title="Check About Us"
          note="Owners, casters and the announcement template, as visitors see them."
          external
        />
        <QuickLink
          href="/"
          title="View public site"
          note="The record exactly as the world sees it."
          external
        />
      </div>

      <h2 className="mt-10 font-condensed text-3xl font-bold uppercase">
        All achievements
      </h2>
      <div className="mt-4">
        <AchievementList achievements={achievements} />
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="border border-line bg-raise px-5 py-4">
      <dd
        className={`font-condensed text-4xl font-bold leading-none ${
          accent ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </dd>
      <dt className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
        {label}
      </dt>
    </div>
  );
}

function QuickLink({
  href,
  title,
  note,
  external = false,
}: {
  href: string;
  title: string;
  note: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank" } : {})}
      className="group border border-line bg-raise p-5 transition hover:border-linestrong"
    >
      <p className="font-condensed text-xl font-bold uppercase leading-tight group-hover:text-brand">
        {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink/55">{note}</p>
    </Link>
  );
}
