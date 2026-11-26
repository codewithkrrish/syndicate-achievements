"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AchievementDTO, GameDTO } from "@/lib/types";
import { formatDate, matchLabel, matchNumberPadded } from "@/lib/format";
import { FORMAT_LABEL, type Format } from "@/lib/validation";
import { useLoopPause } from "./useLoopPause";

interface Props {
  achievement: AchievementDTO;
  onBack: () => void;
}

// Full match view: scoreline, complete spec grid, per-game breakdown with
// lightbox, and the opponent's channel bar (only when a channel is on file).
// No narrative/description copy anywhere — the record speaks in scores.
export default function MatchDetail({ achievement: a, onBack }: Props) {
  const [lightbox, setLightbox] = useState<GameDTO | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  // The scoreline's loops (flow border, chip shine, filed-dot pulse)
  // pause while the block is off-screen.
  const scorelineRef = useLoopPause<HTMLDivElement>();
  const isWin = a.result === "WIN";
  const formatLabel = FORMAT_LABEL[a.format as Format] ?? "";

  // Close with a short fade-out: hold the lightbox mounted for the exit
  // animation, then unmount. Reduced motion (or a missing timer) closes
  // immediately, exactly as before.
  const close = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLightbox(null);
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setLightbox(null);
      setClosing(false);
    }, 180);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <section aria-label={`Match ${matchLabel(a.matchNumber)} in full`}>
      <button
        type="button"
        onClick={onBack}
        className="anim-fade-rise font-condensed text-sm font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand sm:text-base"
      >
        ← Back to the record
      </button>

      <div
        className="anim-fade-rise mt-4 flex items-baseline gap-3 sm:mt-6 sm:gap-4"
        style={{ "--anim-delay": "60ms" } as React.CSSProperties}
      >
        <span className="font-mono text-xs text-brand sm:text-sm">
          {matchNumberPadded(a.matchNumber)}
        </span>
        <h2 className="font-condensed text-[1.7rem] font-bold uppercase leading-none sm:text-5xl">
          Match {matchLabel(a.matchNumber)} — In Full
        </h2>
      </div>

      {/* Scoreline — the perimeter carries the flowing red border
          (.flow-border); the thick left bar stays as before. */}
      <div
        ref={scorelineRef}
        className="anim-fade-rise flow-border mt-8 border-l-4 border-l-brand bg-raise shadow-panel"
        style={{ "--anim-delay": "120ms" } as React.CSSProperties}
      >
        <p className="border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/50 sm:px-7 sm:py-3 sm:text-[11px]">
          <span className="pulse-dot mr-2 inline-block h-2 w-2 rounded-full bg-brand align-middle" />
          Match {matchLabel(a.matchNumber)} · Filed from the #achievement channel
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-5 sm:gap-x-8 sm:gap-y-4 sm:px-7 sm:py-6">
          <div>
            <p className="font-condensed text-[1.75rem] font-bold uppercase leading-none sm:text-5xl">
              SYNDICATE
            </p>
          </div>
          <p className="score-pop font-condensed text-5xl font-bold leading-none sm:text-7xl">
            <span className={isWin ? "text-brand" : "text-ink/50"}>
              {a.finalScore.split("–")[0]?.trim() ?? a.finalScore}
            </span>
            <span className="mx-1 text-ink/30">–</span>
            <span>{a.finalScore.split("–")[1]?.trim() ?? ""}</span>
          </p>
          <span
            className={`chip-shine px-3 py-1.5 font-condensed text-base font-bold uppercase tracking-wider text-white sm:text-lg ${
              isWin ? "bg-brand" : "bg-zinc-600"
            }`}
          >
            {a.result}
          </span>
          <p className="font-condensed text-[1.75rem] font-bold uppercase leading-none text-ink/85 sm:text-5xl">
            {a.opponent}
          </p>
        </div>

        {/* Spec grid */}
        <dl className="grid grid-cols-2 border-t border-line md:grid-cols-5">
          <Spec label="Opponent" value={a.opponent} />
          <Spec label="Date" value={formatDate(a.date, "long")} />
          <Spec label="Mode" value={a.mode} />
          <Spec label="Map" value={a.map} />
          <Spec
            label="Format"
            value={formatLabel ? `${a.format} — ${formatLabel}` : a.format}
            className="col-span-2 md:col-span-1"
          />
        </dl>
      </div>

      {/* Opponent channel bar — only when a channel link is on file.
          Sits directly under the scoreline/spec block, above the games. */}
      {a.opponentChannelUrl && (
        <div
          className="anim-fade-rise mt-6 flex flex-wrap items-center gap-3 border border-line bg-card px-4 py-3.5 sm:mt-8 sm:gap-4 sm:px-5 sm:py-4"
          style={{ "--anim-delay": "140ms" } as React.CSSProperties}
        >
          <span className="live-dot shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 font-condensed text-lg font-semibold uppercase sm:text-xl">
            {a.opponent} <span className="text-ink/40">— YouTube Channel</span>
          </p>
          <a
            href={a.opponentChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center bg-brand px-4 font-condensed text-sm font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:px-5 sm:text-base"
          >
            Visit channel →
          </a>
        </div>
      )}

      {/* Per-game breakdown */}
      <div
        className="anim-fade-rise"
        style={{ "--anim-delay": "180ms" } as React.CSSProperties}
      >
        <h3 className="mt-9 font-condensed text-2xl font-bold uppercase sm:mt-12 sm:text-3xl">
          Per-game breakdown
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-[15px]">
          Every game in the series gets its own block — its score, its Victory or
          Defeat label, and its own result screen. Tap any screenshot to view it
          large.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {a.games.map((g, i) => (
          <article
            key={g.id}
            className="anim-fade-rise lift-hover group border border-line bg-raise"
            style={
              {
                "--anim-delay": `${220 + Math.min(i * 80, 240)}ms`,
              } as React.CSSProperties
            }
          >
            <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
              <h4 className="font-condensed text-xl font-bold uppercase sm:text-2xl">
                Game {g.gameNumber}
              </h4>
              <span
                className={`px-2.5 py-1 font-condensed text-[13px] font-bold uppercase tracking-wider text-white sm:text-sm ${
                  g.result === "Victory" ? "bg-brand" : "bg-zinc-600"
                }`}
              >
                {g.result}
              </span>
              <span className="ml-auto font-condensed text-2xl font-bold leading-none sm:text-3xl">
                {g.scoreFor} <span className="text-ink/30">–</span> {g.scoreAgainst}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(g)}
              className="sheen-host relative block w-full overflow-hidden"
              aria-label={`View game ${g.gameNumber} screenshot large`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.screenshotUrl}
                alt={`Match ${matchLabel(a.matchNumber)}, game ${g.gameNumber} result screen — ${g.result}, ${g.scoreFor} to ${g.scoreAgainst}`}
                className="img-in aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
              <span aria-hidden className="card-sheen" />
            </button>
            <p className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45 sm:px-5 sm:py-3 sm:text-[11px]">
              {a.mode} · {a.map} · {g.result} {g.scoreFor} – {g.scoreAgainst}
            </p>
            {/* Score share bar — the game's own scoreline as a filling
                bar: red is SYNDICATE's share of the rounds, grey the
                opponent's. Widths are final in layout; only the fill
                (scaleX) animates. */}
            <div className="px-4 pb-3.5 sm:px-5 sm:pb-4">
              <div
                className="score-bar"
                role="img"
                aria-label={`Game ${g.gameNumber} score share — SYNDICATE ${g.scoreFor}, ${a.opponent} ${g.scoreAgainst}`}
                style={
                  {
                    "--bar-delay": `${420 + Math.min(i * 80, 240)}ms`,
                  } as React.CSSProperties
                }
              >
                <span
                  className="bg-brand"
                  style={{
                    width: `${
                      g.scoreFor + g.scoreAgainst > 0
                        ? (g.scoreFor / (g.scoreFor + g.scoreAgainst)) * 100
                        : 50
                    }%`,
                  }}
                />
                <span
                  className="score-bar-against bg-linestrong"
                  style={{
                    width: `${
                      g.scoreFor + g.scoreAgainst > 0
                        ? (g.scoreAgainst / (g.scoreFor + g.scoreAgainst)) *
                          100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-10 font-condensed text-sm font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand sm:text-base"
      >
        ← Back to the record
      </button>

      {/* Lightbox — portalled to <body> on purpose: rendered in place it
          sits inside <main>'s stacking context (relative + z-10), so the
          sticky header (z-50, a sibling subtree) painted OVER the viewer's
          top strip and hid the caption row and most of the close button.
          At body level the viewer's own z-index competes directly with
          the header's and wins. */}
      {lightbox &&
        createPortal(
          <div
          role="dialog"
          aria-modal="true"
          aria-label={`Game ${lightbox.gameNumber} screenshot`}
          className={`fixed inset-0 z-[80] flex flex-col bg-black/92 p-4 backdrop-blur-sm sm:p-8 ${
            closing ? "lightbox-out" : "lightbox-in"
          }`}
          onClick={close}
        >
          <div className="relative z-10 flex items-center justify-between gap-4 pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70">
              Match {matchLabel(a.matchNumber)} · Game {lightbox.gameNumber} —{" "}
              {lightbox.result}, {lightbox.scoreFor} – {lightbox.scoreAgainst} ·{" "}
              {a.mode}, {a.map}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close screenshot viewer"
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-brand text-2xl font-bold text-white shadow-[0_4px_18px_rgba(0,0,0,0.6)] transition duration-300 hover:rotate-45 hover:bg-branddeep"
            >
              ×
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.screenshotUrl}
            alt={`Game ${lightbox.gameNumber} result screen, large`}
            className={`min-h-0 flex-1 object-contain ${
              closing ? "lightbox-img-out" : "lightbox-img-in"
            }`}
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
          </div>,
          document.body,
        )}
    </section>
  );
}

function Spec({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`border-line px-4 py-3.5 [&:not(:last-child)]:border-r sm:px-5 sm:py-4 max-md:[&:nth-child(2)]:border-r-0 ${className}`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink/95 sm:text-[15px]">{value}</dd>
    </div>
  );
}
