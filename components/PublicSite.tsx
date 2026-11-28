"use client";

import { useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AchievementDTO } from "@/lib/types";
import { detailPath, formatDate, recordLabel, thumbnailOf } from "@/lib/format";
import SiteHeader from "./SiteHeader";
import SiteFooter, { SiteBackdrop } from "./SiteFooter";
import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { useLoopPause } from "./useLoopPause";

// Old in-page match links (#creators-001 / #ordinary-001, and the
// legacy #match-002 from before per-record numbering) no longer open
// an in-page view: each match lives on its own page now, so a hash
// naming a match resolves to that record and the caller redirects to
// its real URL — old shared links keep working and land on the page
// they always meant.
function matchFromHash(achievements: AchievementDTO[]): AchievementDTO | null {
  const h = window.location.hash;
  const scoped = h.match(/^#(creators|ordinary)-(\d+)$/);
  if (scoped) {
    const num = parseInt(scoped[2], 10);
    return (
      achievements.find((x) =>
        scoped[1] === "creators"
          ? x.category === "CREATOR" && x.matchNumber === num
          : x.category !== "CREATOR" && x.matchNumber === num,
      ) ?? null
    );
  }
  const legacy = h.match(/^#match-(\d+)$/);
  if (legacy) {
    const num = parseInt(legacy[1], 10);
    const hits = achievements.filter((x) => x.matchNumber === num);
    if (hits.length === 1) return hits[0];
  }
  return null;
}

// The home page: hero, match-level stats, results ticker, and a summary
// entry for each of the two record collections. Everything it points
// at is a page of its own — the collections at /creators-record and
// /ordinary-record, each match at /creators-record/001 (etc.), About
// at /about — so no URL on the site carries a "#" hash. The only hash
// handling left here is rescue duty for old links: a match hash
// (#creators-001) redirects to the match's page, "#about" redirects
// to /about, and the long-gone "#record" tag is stripped on sight.
export default function PublicSite({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const router = useRouter();
  // Continuous loops pause while their section is off-screen.
  const heroRef = useLoopPause<HTMLElement>();
  const tickerRef = useLoopPause<HTMLDivElement>();

  // Rescue old hash links, on first load and on Back/Forward alike.
  useEffect(() => {
    const rescue = () => {
      const m = matchFromHash(achievements);
      if (m) {
        router.replace(detailPath(m));
        return;
      }
      if (window.location.hash === "#about") {
        router.replace("/about");
        return;
      }
      if (window.location.hash === "#record") {
        history.replaceState(null, "", window.location.pathname);
      }
    };
    rescue();
    window.addEventListener("popstate", rescue);
    window.addEventListener("hashchange", rescue);
    return () => {
      window.removeEventListener("popstate", rescue);
      window.removeEventListener("hashchange", rescue);
    };
  }, [achievements, router]);

  // Opening a match goes to the match's own page — its URL is the
  // shareable one, with its own preview.
  const openMatch = useCallback(
    (id: number) => {
      const a = achievements.find((x) => x.id === id);
      if (a) router.push(detailPath(a));
    },
    [achievements, router],
  );

  // Anything not filed as CREATOR reads as Ordinary, so a record can
  // never fall out of both collections.
  const creators = useMemo(
    () => achievements.filter((a) => a.category === "CREATOR"),
    [achievements],
  );
  const ordinary = useMemo(
    () => achievements.filter((a) => a.category !== "CREATOR"),
    [achievements],
  );

  // Hero stats (count-up) and the results ticker — both derived from the
  // same record data the cards show; nothing here is new copy, just the
  // archive's own numbers and scorelines.
  // All four stats are match-level: one achievement is one complete
  // match (a BO3 counts once — its games are never tallied here).
  const stats = useMemo(() => {
    const played = achievements.length;
    const wins = achievements.filter((a) => a.result === "WIN").length;
    const losses = achievements.filter((a) => a.result === "LOSS").length;
    return {
      played,
      wins,
      losses,
      winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
    };
  }, [achievements]);

  const tickerLines = useMemo(() => {
    const lines: string[] = [];
    for (const a of achievements) {
      lines.push(
        `${recordLabel(a)} · SYNDICATE ${a.finalScore} ${a.opponent} — ${a.result}`,
      );
      for (const g of a.games) {
        lines.push(
          `Game ${g.gameNumber} · ${g.scoreFor} – ${g.scoreAgainst} ${g.result}`,
        );
      }
      lines.push(`${a.mode} · ${a.map} · ${formatDate(a.date)}`);
    }
    return lines;
  }, [achievements]);

  return (
    // touch-pan-y (on every public page root): the archive is laid out
    // to fit the phone exactly, so the browser gets no say in moving it
    // sideways — vertical scrolling only, no pinch-zoom or side-pan of
    // the page itself. The screenshot lightbox is portalled to <body>,
    // outside this root, and keeps its pinch-zoom on purpose: a result
    // screen is exactly what a visitor wants to zoom into.
    <div className="relative min-h-dvh touch-pan-y">
      <SiteBackdrop />
      <SiteHeader active={null} />

      <main className="relative z-10 scroll-mt-20">
          <div className="view-enter">
            {/* Hero */}
            <section
              ref={heroRef}
              className="relative overflow-hidden border-b border-line"
            >
              {/* Hero art via next/image with priority: the LCP element
                  gets a right-sized optimized variant and loads first;
                  everything below the fold stays lazy. */}
              <Image
                src="/seed/hero-arena.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                className="img-in object-cover object-[center_62%] opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050506]/60 via-[#050506]/25 to-[#050506]/90" />
              {/* No ember canvas here: the flakes live site-wide in
                  SiteBackdrop now, behind all content on every page. */}
              <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-24">
                <p className="anim-fade-rise flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#ffb3b0] sm:text-xs">
                  <span className="h-0.5 w-8 bg-brand" aria-hidden />
                  The official match archive
                </p>
                <h1
                  className="anim-fade-rise mt-3 font-condensed text-[clamp(2.5rem,11.5vw,7rem)] font-bold uppercase leading-[0.92] sm:mt-4"
                  style={{ "--anim-delay": "70ms" } as React.CSSProperties}
                >
                  <span className="title-shine title-shine-light anim-loop">
                    SYNDICATE
                  </span>
                  <span className="title-shine title-shine-red anim-loop block">
                    Achievements
                  </span>
                </h1>
                <p
                  className="anim-fade-rise mt-4 max-w-xl text-sm leading-relaxed text-ink/75 sm:mt-5 sm:text-base"
                  style={{ "--anim-delay": "140ms" } as React.CSSProperties}
                >
                  Every guild-vs-guild match the squad has filed — final
                  scores, every game, every result screen. Nothing here is a
                  claim; it is all on record.
                </p>
                <div
                  className="anim-fade-rise mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row"
                  style={{ "--anim-delay": "210ms" } as React.CSSProperties}
                >
                  <Link
                    href="/creators-record"
                    className="inline-flex min-h-11 items-center justify-center bg-brand px-5 font-condensed text-base font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:min-h-12 sm:px-7 sm:text-lg"
                  >
                    Browse the record
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex min-h-11 items-center justify-center border border-linestrong bg-black/30 px-5 font-condensed text-base font-bold uppercase tracking-wider text-ink backdrop-blur-sm transition hover:border-brand hover:text-brand sm:min-h-12 sm:px-7 sm:text-lg"
                  >
                    About the guild
                  </Link>
                </div>
                {achievements.length > 0 && (
                  <div
                    className="anim-fade-rise mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:mt-10 sm:grid-cols-4 sm:gap-y-5 sm:pt-6"
                    style={{ "--anim-delay": "280ms" } as React.CSSProperties}
                  >
                    <HeroStat label="Total Match Played">
                      <CountUp value={stats.played} />
                    </HeroStat>
                    <HeroStat label="Total Win">
                      <CountUp value={stats.wins} />
                    </HeroStat>
                    <HeroStat label="Total Lost">
                      <CountUp value={stats.losses} />
                    </HeroStat>
                    <HeroStat label="Win Rate">
                      <CountUp value={stats.winRate} />
                      <span className="text-brand">%</span>
                    </HeroStat>
                  </div>
                )}
              </div>
            </section>

            {/* Results ticker — the record's own scorelines, scrolling
                under the hero. Pure decoration for sighted visitors:
                every line is duplicated in the cards below. */}
            {tickerLines.length > 0 && (
              <div
                ref={tickerRef}
                className="ticker border-b border-line bg-[#0d0d0f]"
                aria-hidden
              >
                <div
                  className="ticker-track anim-loop"
                  style={{
                    animationDuration: `${Math.max(24, tickerLines.length * 8)}s`,
                  }}
                >
                  {[0, 1].map((copy) => (
                    <div key={copy} className="ticker-copy">
                      {tickerLines.map((line, i) => (
                        <span
                          key={i}
                          className="ticker-item font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60"
                        >
                          {line}
                          <span className="ticker-sep" />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The two collections — summaries only; each full record
                lives on its own page. */}
            <CategorySummary
              number="01"
              title="Creators Record"
              blurb="Records filed against creator-led teams — opponents who run a YouTube or Instagram channel."
              href="/creators-record"
              records={creators}
              onOpen={openMatch}
            />
            <CategorySummary
              number="02"
              title="Ordinary Record"
              blurb="Records filed against regular in-game guilds."
              href="/ordinary-record"
              records={ordinary}
              onOpen={openMatch}
              divided
              className="pb-16 sm:pb-20"
            />
          </div>
      </main>

      <SiteFooter achievements={achievements} />
    </div>
  );
}

/** One collection's entry on the home page: its heading and filing
 *  rule, a preview of its latest record (tap opens the match), its
 *  record count, and a clear link through to the collection's own
 *  page — where the full list lives. */
function CategorySummary({
  number,
  title,
  blurb,
  href,
  records,
  onOpen,
  divided = false,
  className = "",
}: {
  number: string;
  title: string;
  blurb: string;
  href: string;
  records: AchievementDTO[];
  onOpen: (id: number) => void;
  divided?: boolean;
  className?: string;
}) {
  const latest = records[0];
  const thumb = latest ? thumbnailOf(latest) : null;
  const isWin = latest?.result === "WIN";

  return (
    <section
      className={`mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 ${
        divided ? "border-t border-line" : ""
      } ${className}`}
    >
      <Reveal>
        <div className="flex items-baseline gap-3 sm:gap-4">
          <span className="font-mono text-xs text-brand sm:text-sm">
            {number}
          </span>
          <h2 className="font-condensed text-[1.75rem] font-bold uppercase leading-none sm:text-5xl">
            {title}
          </h2>
        </div>
        <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-ink/55 sm:mt-3 sm:text-[15px]">
          {blurb}
        </p>
      </Reveal>

      <Reveal className="mt-5 sm:mt-6" delay={60}>
        <div className="border border-line bg-raise">
          {latest ? (
            <button
              type="button"
              onClick={() => onOpen(latest.id)}
              className="flex w-full items-center gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-5"
              aria-label={`View the latest ${title} entry — ${recordLabel(latest)} against ${latest.opponent}`}
            >
              {thumb && (
                <Image
                  src={thumb}
                  alt=""
                  width={288}
                  height={162}
                  className="aspect-video w-24 shrink-0 border border-line object-cover sm:w-36"
                />
              )}
              <span className="min-w-0 flex-1">
                {/* The record label must stay free to wrap: set in
                    mono with this tracking it measures wider than the
                    column beside the thumbnail on phones, and as a
                    nowrap span it spilled sideways over the score
                    badge. "Latest ·" alone keeps its nowrap — it is
                    short and always fits on the first line. */}
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-brand sm:text-[11px]">
                  <span className="whitespace-nowrap">Latest ·</span>{" "}
                  {recordLabel(latest)}
                </span>
                <span className="mt-1 block truncate font-condensed text-xl font-bold uppercase leading-tight sm:text-2xl">
                  SYNDICATE <span className="text-ink/40">vs</span>{" "}
                  {latest.opponent}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-ink/55 sm:text-sm">
                  {formatDate(latest.date)} · {latest.mode} · {latest.map} ·{" "}
                  {latest.format}
                </span>
              </span>
              <span
                className={`shrink-0 px-2.5 py-1.5 text-center font-condensed text-base font-bold leading-none text-white sm:text-lg ${
                  isWin ? "bg-brand" : "bg-zinc-600"
                }`}
              >
                {latest.finalScore}
                <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.18em] opacity-85">
                  {latest.result}
                </span>
              </span>
            </button>
          ) : (
            <p className="px-4 py-6 text-[13px] leading-relaxed text-ink/55 sm:px-5 sm:text-sm">
              <span className="font-condensed text-lg font-bold uppercase text-ink sm:text-xl">
                No records filed yet.
              </span>{" "}
              When the guild files a record in this collection, the latest
              one will be previewed here.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 sm:px-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45">
              {records.length}{" "}
              {records.length === 1 ? "record" : "records"} filed
            </span>
            <Link
              href={href}
              className="ml-auto font-condensed text-sm font-bold uppercase tracking-wider text-brand transition hover:text-[#ff6b66] sm:text-base"
            >
              View the {title} →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function HeroStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-condensed text-3xl font-bold leading-none sm:text-4xl">
        {children}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">
        {label}
      </p>
    </div>
  );
}
