"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { AchievementDTO } from "@/lib/types";
import { formatDate, matchHash, recordLabel, thumbnailOf } from "@/lib/format";
import SiteHeader from "./SiteHeader";
import SiteFooter, { SiteBackdrop } from "./SiteFooter";
import Reveal from "./Reveal";
import MatchDetail from "./MatchDetail";
import AboutView from "./AboutView";
import CountUp from "./CountUp";
import { useLoopPause } from "./useLoopPause";

type View =
  | { name: "list" }
  | { name: "detail"; id: number }
  | { name: "about" };

function hashFor(view: View, achievements: AchievementDTO[]): string {
  if (view.name === "about") return "#about";
  if (view.name === "detail") {
    const a = achievements.find((x) => x.id === view.id);
    return a ? matchHash(a) : "#record";
  }
  return "#record";
}

function viewFromHash(achievements: AchievementDTO[]): View {
  const h = window.location.hash;
  if (h === "#about") return { name: "about" };
  // Current scheme: the slug carries the record as well as the number
  // (#creators-001 / #ordinary-001) — numbers restart in each record,
  // so a bare number no longer identifies a match on its own.
  const scoped = h.match(/^#(creators|ordinary)-(\d+)$/);
  if (scoped) {
    const num = parseInt(scoped[2], 10);
    const a = achievements.find((x) =>
      scoped[1] === "creators"
        ? x.category === "CREATOR" && x.matchNumber === num
        : x.category !== "CREATOR" && x.matchNumber === num,
    );
    if (a) return { name: "detail", id: a.id };
  }
  // Legacy scheme from before per-record numbering (#match-002):
  // follow the number when exactly one record carries it.
  const legacy = h.match(/^#match-(\d+)$/);
  if (legacy) {
    const num = parseInt(legacy[1], 10);
    const hits = achievements.filter((x) => x.matchNumber === num);
    if (hits.length === 1) return { name: "detail", id: hits[0].id };
  }
  return { name: "list" };
}

// The home page: hero, match-level stats, results ticker, and a summary
// entry for each of the two record collections. The full collections
// live on their own pages (/creators-record, /ordinary-record); match
// detail and About remain in-page views here so the long-standing hash
// deep-links (#creators-001, #about) keep working exactly as before.
export default function PublicSite({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const [view, setView] = useState<View>({ name: "list" });
  const mainRef = useRef<HTMLElement>(null);
  // Continuous loops pause while their section is off-screen.
  const heroRef = useLoopPause<HTMLElement>();
  const tickerRef = useLoopPause<HTMLDivElement>();

  // Initial view from the URL hash (deep links).
  useEffect(() => {
    setView(viewFromHash(achievements));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/Forward support.
  useEffect(() => {
    const onPop = () => setView(viewFromHash(achievements));
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, [achievements]);

  const navigate = useCallback(
    (next: View) => {
      setView(next);
      const h = hashFor(next, achievements);
      if (window.location.hash !== h) {
        history.pushState(null, "", h);
      }
      mainRef.current?.scrollIntoView({ block: "start" });
    },
    [achievements],
  );

  const openMatch = useCallback(
    (id: number) => navigate({ name: "detail", id }),
    [navigate],
  );
  const goList = useCallback(() => navigate({ name: "list" }), [navigate]);
  const goAbout = useCallback(() => navigate({ name: "about" }), [navigate]);

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

  const selected =
    view.name === "detail"
      ? achievements.find((a) => a.id === view.id) ?? null
      : null;

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
    <div className="relative min-h-dvh">
      <SiteBackdrop />
      <SiteHeader
        active={view.name === "about" ? "about" : null}
        onAbout={goAbout}
        onHome={goList}
      />

      <main ref={mainRef} className="relative z-10 scroll-mt-20">
        {view.name === "list" && (
          <div key="list" className="view-enter">
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
                  <a
                    href="/creators-record"
                    className="inline-flex min-h-11 items-center justify-center bg-brand px-5 font-condensed text-base font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:min-h-12 sm:px-7 sm:text-lg"
                  >
                    Browse the record
                  </a>
                  <button
                    type="button"
                    onClick={goAbout}
                    className="inline-flex min-h-11 items-center justify-center border border-linestrong bg-black/30 px-5 font-condensed text-base font-bold uppercase tracking-wider text-ink backdrop-blur-sm transition hover:border-brand hover:text-brand sm:min-h-12 sm:px-7 sm:text-lg"
                  >
                    About the guild
                  </button>
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
        )}

        {view.name === "detail" && (
          <div
            key={`detail-${view.id}`}
            className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8"
          >
            {selected ? (
              <MatchDetail achievement={selected} onBack={goList} />
            ) : (
              <div className="border border-dashed border-linestrong bg-raise px-6 py-14 text-center">
                <p className="font-condensed text-3xl font-bold uppercase">
                  That match is no longer on record
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink/55">
                  It may have been removed from the archive. The full record is
                  still there — head back and pick another record.
                </p>
                <button
                  type="button"
                  onClick={goList}
                  className="mt-6 inline-flex min-h-11 items-center border border-linestrong px-5 font-condensed text-base font-semibold uppercase tracking-wider transition hover:border-brand hover:text-brand"
                >
                  Back to the record
                </button>
              </div>
            )}
          </div>
        )}

        {view.name === "about" && (
          <div
            key="about"
            className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8"
          >
            <AboutView onBack={goList} />
          </div>
        )}
      </main>

      <SiteFooter achievements={achievements} onAbout={goAbout} />
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
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-brand sm:text-[11px]">
                  <span className="whitespace-nowrap">Latest ·</span>{" "}
                  <span className="whitespace-nowrap">{recordLabel(latest)}</span>
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
            <a
              href={href}
              className="ml-auto font-condensed text-sm font-bold uppercase tracking-wider text-brand transition hover:text-[#ff6b66] sm:text-base"
            >
              View the {title} →
            </a>
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
