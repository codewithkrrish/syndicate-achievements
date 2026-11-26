"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AchievementDTO } from "@/lib/types";
import { GUILD } from "@/lib/site";
import { formatDate, matchLabel } from "@/lib/format";
import EmberCanvas from "./EmberCanvas";
import SearchBar from "./SearchBar";
import RecordCard from "./RecordCard";
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
    return a ? `#match-${String(a.matchNumber).padStart(3, "0")}` : "#record";
  }
  return "#record";
}

function viewFromHash(achievements: AchievementDTO[]): View {
  const h = window.location.hash;
  if (h === "#about") return { name: "about" };
  const m = h.match(/^#match-(\d+)$/);
  if (m) {
    const num = parseInt(m[1], 10);
    const a = achievements.find((x) => x.matchNumber === num);
    if (a) return { name: "detail", id: a.id };
  }
  return { name: "list" };
}

// The public archive as one page with three views (record list / match
// detail / about), mirroring the V1 site's behaviour — including hash
// deep-links (#match-002, #about) and working Back/Forward.
export default function PublicSite({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const [view, setView] = useState<View>({ name: "list" });
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  // Continuous loops pause while their section is off-screen.
  const heroRef = useLoopPause<HTMLElement>();
  const tickerRef = useLoopPause<HTMLDivElement>();
  const footerRef = useLoopPause<HTMLElement>();

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

  // Header scroll state (depth shadow) + the top scroll-progress line.
  // The progress bar is mutated directly through its ref — no React
  // re-render per scroll frame — and the shadow state only flips when
  // the page crosses the threshold, so scrolling stays cheap.
  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const isScrolled = y > 8;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(y / max, 1) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Hidden tabs pause every continuous CSS loop (see .tab-hidden in
  // globals.css). The ember canvas pauses itself the same way.
  useEffect(() => {
    const onVisibility = () =>
      document.documentElement.classList.toggle("tab-hidden", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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

  const focusSearch = useCallback(() => {
    navigate({ name: "list" });
    // Wait for the list view to mount before focusing.
    window.setTimeout(() => searchRef.current?.focus(), 60);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return achievements;
    return achievements.filter((a) => a.opponent.toLowerCase().includes(q));
  }, [achievements, query]);

  const selected =
    view.name === "detail"
      ? achievements.find((a) => a.id === view.id) ?? null
      : null;

  const latest = achievements[0];

  // Hero stats (count-up) and the results ticker — both derived from the
  // same record data the cards show; nothing here is new copy, just the
  // archive's own numbers and scorelines.
  const stats = useMemo(() => {
    const series = achievements.length;
    const seriesWon = achievements.filter((a) => a.result === "WIN").length;
    const games = achievements.reduce((n, a) => n + a.games.length, 0);
    const gamesWon = achievements.reduce(
      (n, a) => n + a.games.filter((g) => g.result === "Victory").length,
      0,
    );
    return {
      series,
      seriesWon,
      games,
      winRate: games > 0 ? Math.round((gamesWon / games) * 100) : 0,
    };
  }, [achievements]);

  const tickerLines = useMemo(() => {
    const lines: string[] = [];
    for (const a of achievements) {
      lines.push(
        `Match ${matchLabel(a.matchNumber)} · SYNDICATE ${a.finalScore} ${a.opponent} — ${a.result}`,
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
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="bg-glow bg-glow-a anim-loop" />
        <div className="bg-glow bg-glow-b anim-loop" />
      </div>
      <EmberCanvas />

      {/* Header */}
      <header
        className={`anim-fade-in sticky top-0 z-50 border-b border-line bg-bg/88 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_12px_32px_rgba(0,0,0,0.5)]" : ""
        }`}
      >
        {/* Scroll progress — a thin red line at the very top, filled by
            the scroll listener through a ref (transform only). */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          aria-hidden
        >
          <div
            ref={progressRef}
            className="h-full origin-left bg-brand"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <div className="mx-auto flex max-w-6xl items-stretch gap-1 px-3 sm:gap-2 sm:px-6">
          <button
            type="button"
            onClick={goList}
            className="flex min-w-0 items-center gap-2.5 py-3 text-left sm:gap-3"
            aria-label="SYNDICATE Achievements — home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guild-logo.webp"
              alt=""
              width={40}
              height={40}
              decoding="async"
              className="logo-glow anim-loop h-9 w-9 shrink-0 object-cover sm:h-10 sm:w-10"
            />
            <span className="leading-none">
              <span className="block font-condensed text-[19px] font-bold uppercase tracking-wide sm:text-[22px]">
                SYNDICATE
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.3em] text-ink/55 sm:text-[10px] sm:tracking-[0.34em]">
                Achievements
              </span>
            </span>
          </button>
          <nav
            className="ml-auto flex items-stretch"
            aria-label="Site"
          >
            <NavButton active={view.name !== "about"} onClick={goList}>
              The Record
            </NavButton>
            <NavButton onClick={focusSearch}>Search</NavButton>
            <NavButton active={view.name === "about"} onClick={goAbout}>
              About Us
            </NavButton>
          </nav>
        </div>
      </header>

      <main ref={mainRef} className="relative z-10 scroll-mt-20">
        {view.name === "list" && (
          <div key="list" className="view-enter">
            {/* Hero */}
            <section
              ref={heroRef}
              className="relative overflow-hidden border-b border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/seed/hero-arena.webp"
                alt=""
                fetchPriority="high"
                className="img-in absolute inset-0 h-full w-full object-cover object-[center_62%] opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050506]/60 via-[#050506]/25 to-[#050506]/90" />
              <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
                <p className="anim-fade-rise flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#ffb3b0]">
                  <span className="h-0.5 w-8 bg-brand" aria-hidden />
                  The official match archive
                </p>
                <h1
                  className="anim-fade-rise mt-4 font-condensed text-[clamp(3.4rem,11vw,7rem)] font-bold uppercase leading-[0.92]"
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
                  className="anim-fade-rise mt-5 max-w-xl text-base leading-relaxed text-ink/75"
                  style={{ "--anim-delay": "140ms" } as React.CSSProperties}
                >
                  Every guild-vs-guild series the squad has filed — final
                  scores, every game, every result screen. Nothing here is a
                  claim; it is all on record.
                </p>
                <div
                  className="anim-fade-rise mt-8 flex flex-col gap-3 sm:flex-row"
                  style={{ "--anim-delay": "210ms" } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("record")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex min-h-12 items-center justify-center bg-brand px-7 font-condensed text-lg font-bold uppercase tracking-wider text-white transition hover:bg-branddeep"
                  >
                    Browse the record
                  </button>
                  <button
                    type="button"
                    onClick={goAbout}
                    className="inline-flex min-h-12 items-center justify-center border border-linestrong bg-black/30 px-7 font-condensed text-lg font-bold uppercase tracking-wider text-ink backdrop-blur-sm transition hover:border-brand hover:text-brand"
                  >
                    About the guild
                  </button>
                </div>
                {achievements.length > 0 && (
                  <div
                    className="anim-fade-rise mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4"
                    style={{ "--anim-delay": "280ms" } as React.CSSProperties}
                  >
                    <HeroStat label="Series filed">
                      <CountUp value={stats.series} />
                    </HeroStat>
                    <HeroStat label="Series won">
                      <CountUp value={stats.seriesWon} />
                    </HeroStat>
                    <HeroStat label="Games played">
                      <CountUp value={stats.games} />
                    </HeroStat>
                    <HeroStat label="Game win rate">
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

            {/* The Record */}
            <section
              id="record"
              className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 pt-10 sm:px-6"
            >
              <Reveal>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-brand">01</span>
                  <h2 className="font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
                    The Record
                  </h2>
                </div>
              </Reveal>

              <Reveal className="mt-7" delay={60}>
                <SearchBar
                  achievements={achievements}
                  query={query}
                  onQueryChange={setQuery}
                  onOpen={openMatch}
                  inputRef={searchRef}
                />
              </Reveal>

              <div className="mt-4 space-y-4">
                {achievements.length === 0 ? (
                  <Reveal>
                    <div className="border border-dashed border-linestrong bg-raise px-6 py-14 text-center">
                      <p className="font-condensed text-3xl font-bold uppercase">
                        No achievements on record yet
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
                        The archive is empty for now. When the guild files its
                        first win, it will be recorded here — score, screenshots
                        and all.
                      </p>
                    </div>
                  </Reveal>
                ) : filtered.length === 0 ? (
                  <Reveal>
                    <div className="border border-dashed border-linestrong bg-raise px-6 py-14 text-center">
                      <p className="font-condensed text-3xl font-bold uppercase">
                        No guild found
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
                        Nothing in the record matches &ldquo;{query.trim()}&rdquo;.
                        Check the name, or clear the search to see every filed
                        series.
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="mt-6 inline-flex min-h-11 items-center border border-linestrong px-5 font-condensed text-base font-semibold uppercase tracking-wider transition hover:border-brand hover:text-brand"
                      >
                        Clear search
                      </button>
                    </div>
                  </Reveal>
                ) : (
                  filtered.map((a, i) => (
                    <Reveal key={a.id} delay={Math.min(i * 75, 300)}>
                      <RecordCard achievement={a} onOpen={openMatch} />
                    </Reveal>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {view.name === "detail" && (
          <div
            key={`detail-${view.id}`}
            className="view-enter mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6"
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
                  still there — head back and pick another series.
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
            className="view-enter mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6"
          >
            <AboutView onBack={goList} />
          </div>
        )}
      </main>

      {/* Footer — guild links only, never personal links. */}
      <footer
        ref={footerRef}
        className="footer-flow relative z-10 border-t border-line bg-[#08080a]"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="font-condensed text-2xl font-bold uppercase leading-none">
              SYNDICATE{" "}
              <span className="title-shine title-shine-red anim-loop">
                Achievements
              </span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/50">
              The squad&rsquo;s official match archive.
              {latest
                ? ` ${matchLabel(latest.matchNumber)} on file — ${achievements.length} ${
                    achievements.length === 1 ? "series" : "series"
                  } in the record.`
                : " The first filed win is pending."}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-7 gap-y-3 md:ml-auto"
            aria-label="Guild links"
          >
            <a
              href={GUILD.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-line font-condensed text-base font-semibold uppercase tracking-wider text-ink/70 transition hover:text-brand"
            >
              {GUILD.instagramHandle}
            </a>
            <a
              href={GUILD.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-line font-condensed text-base font-semibold uppercase tracking-wider text-ink/70 transition hover:text-brand"
            >
              Discord
            </a>
            <button
              type="button"
              onClick={goAbout}
              className="link-line font-condensed text-base font-semibold uppercase tracking-wider text-ink/70 transition hover:text-brand"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="link-line font-condensed text-base font-semibold uppercase tracking-wider text-ink/70 transition hover:text-brand"
            >
              Back to top
            </button>
          </nav>
        </div>
      </footer>
    </div>
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
      <p className="font-condensed text-4xl font-bold leading-none">
        {children}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">
        {label}
      </p>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nav-btn relative flex min-h-11 items-center whitespace-nowrap px-2 font-condensed text-sm font-semibold uppercase tracking-wider transition sm:px-4 sm:text-base ${
        active ? "text-ink" : "text-ink/60 hover:text-ink"
      }`}
    >
      {children}
      {/* Sliding underline: scales in from the left on hover/focus, and
          rests fully open on the active view (see .nav-underline). */}
      <span
        aria-hidden
        className={`nav-underline${active ? " nav-underline-active" : ""}`}
      />
    </button>
  );
}
