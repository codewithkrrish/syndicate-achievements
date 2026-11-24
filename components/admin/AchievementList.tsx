"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AchievementDTO } from "@/lib/types";
import { formatDate, matchLabel, thumbnailOf } from "@/lib/format";

// Dashboard achievement list with live search (opponent / match number)
// and a result filter. Filtering is client-side: the whole archive is
// small, and the admin gets instant feedback while typing.
export default function AchievementList({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return achievements.filter((a) => {
      if (result !== "ALL" && a.result !== result) return false;
      if (!q) return true;
      return (
        a.opponent.toLowerCase().includes(q) ||
        String(a.matchNumber).includes(q) ||
        matchLabel(a.matchNumber).toLowerCase().includes(q)
      );
    });
  }, [achievements, query, result]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-stretch border border-linestrong bg-raise focus-within:border-brand">
          <span className="flex items-center pl-3.5 text-ink/50" aria-hidden>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.8-3.8" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by opponent or match number"
            aria-label="Search achievements"
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink/35"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-3 font-condensed text-sm font-semibold uppercase tracking-wider text-ink/60 hover:text-brand"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex" role="group" aria-label="Filter by result">
          {(["ALL", "WIN", "LOSS"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResult(r)}
              className={`min-h-11 border px-4 font-condensed text-sm font-bold uppercase tracking-wider transition ${
                result === r
                  ? "border-brand bg-brand text-white"
                  : "border-linestrong bg-raise text-ink/60 hover:text-ink"
              } ${r !== "ALL" ? "-ml-px" : ""}`}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-3 font-mono text-xs text-ink/45">
        Showing {filtered.length} of {achievements.length}{" "}
        {achievements.length === 1 ? "achievement" : "achievements"}
      </p>

      <div className="mt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-linestrong bg-raise px-6 py-12 text-center">
            <p className="font-condensed text-2xl font-bold uppercase">
              {achievements.length === 0
                ? "No achievements yet"
                : "Nothing matches that filter"}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-ink/55">
              {achievements.length === 0
                ? "Add the first achievement and it will appear here and on the public site."
                : "Try a different opponent name, match number, or result filter."}
            </p>
            {achievements.length === 0 && (
              <Link
                href="/admin/achievements/new"
                className="mt-5 inline-flex min-h-11 items-center bg-brand px-5 font-condensed text-base font-bold uppercase tracking-wider text-white transition hover:bg-branddeep"
              >
                Add achievement
              </Link>
            )}
          </div>
        ) : (
          filtered.map((a) => {
            const thumb = thumbnailOf(a);
            const isWin = a.result === "WIN";
            return (
              <article
                key={a.id}
                className="flex flex-col gap-4 border border-line bg-raise p-4 sm:flex-row sm:items-center"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="aspect-video w-full shrink-0 border border-line object-cover sm:w-40"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex aspect-video w-full shrink-0 items-center justify-center border border-line bg-card font-mono text-[10px] uppercase tracking-widest text-ink/30 sm:w-40">
                    No image
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
                    Match {matchLabel(a.matchNumber)} · {a.format} ·{" "}
                    {formatDate(a.date)}
                  </p>
                  <h3 className="mt-1 truncate font-condensed text-2xl font-bold uppercase leading-tight">
                    SYNDICATE vs {a.opponent}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-ink/55">
                    {a.mode} · {a.map} · {a.games.length}{" "}
                    {a.games.length === 1 ? "game" : "games"} on file
                  </p>
                </div>
                <span
                  className={`shrink-0 px-3 py-1.5 text-center font-condensed text-lg font-bold leading-none ${
                    isWin ? "bg-brand text-white" : "bg-zinc-600 text-white"
                  }`}
                >
                  {a.result}
                  <span className="mt-0.5 block text-sm font-semibold opacity-85">
                    {a.finalScore}
                  </span>
                </span>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/admin/achievements/${a.id}/edit`}
                    className="inline-flex min-h-10 items-center border border-linestrong px-4 font-condensed text-sm font-semibold uppercase tracking-wider transition hover:border-brand hover:text-brand"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/achievements/${a.id}/delete`}
                    className="inline-flex min-h-10 items-center border border-brand/60 px-4 font-condensed text-sm font-semibold uppercase tracking-wider text-[#ff8a86] transition hover:bg-brand hover:text-white"
                  >
                    Delete
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
