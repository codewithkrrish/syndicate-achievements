"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "./SafeImage";
import type { AchievementDTO, GameDTO } from "@/lib/types";
import { formatDate, matchNumberPadded, recordLabel } from "@/lib/format";
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
  const [downloading, setDownloading] = useState(false);
  // The lightbox opens the original full-size screenshot directly (no
  // optimizer in between), so it heals the same way SafeImage does: a
  // failed load retries with a fresh query instead of staying broken
  // until the viewer is closed and reopened.
  const [lbAttempt, setLbAttempt] = useState(0);
  const lbTimer = useRef<number | null>(null);
  useEffect(() => {
    setLbAttempt(0);
    setDownloading(false);
  }, [lightbox]);
  useEffect(
    () => () => {
      if (lbTimer.current) window.clearTimeout(lbTimer.current);
    },
    [],
  );
  const closeTimer = useRef<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
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

  // Download the open screenshot at its original size. Fetch it as a
  // blob so the saved file gets a clean name even when the image is
  // served cross-origin (a bare <a download> drops the filename
  // off-origin); if the fetch fails for any reason, fall back to
  // opening the original in a new tab. The click is stopped here so
  // it never reaches the backdrop's close handler.
  const download = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!lightbox || downloading) return;
    const url = lightbox.screenshotUrl;
    const slug = a.opponent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `syndicate-vs-${slug || "opponent"}-game-${lightbox.gameNumber}.jpg`;
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!lightbox) return;
    // Keyboard and screen-reader users land inside the dialog, on its
    // close control — not stranded behind the overlay.
    closeBtnRef.current?.focus({ preventScroll: true });
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
    <section aria-label={`${recordLabel(a)} in full`}>
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
        <h2 className="font-condensed text-[1.45rem] font-bold uppercase leading-none sm:text-5xl">
          {recordLabel(a)} — In Full
        </h2>
      </div>

      {/* Scoreline — the perimeter carries the flowing red border
          (.flow-border); the thick left bar stays as before. */}
      <div
        ref={scorelineRef}
        className="anim-fade-rise flow-border mt-8 border-l-4 border-l-brand bg-raise shadow-panel"
        style={{ "--anim-delay": "120ms" } as React.CSSProperties}
      >
        <p className="flex flex-wrap items-center gap-x-2 border-b border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/50 sm:px-7 sm:py-3 sm:text-[11px] sm:tracking-[0.22em]">
          <span className="pulse-dot inline-block h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span className="whitespace-nowrap">{recordLabel(a)}</span>
          <span className="whitespace-nowrap">
            · Filed from the #achievement channel
          </span>
        </p>
        {/* One line on phones by design: the row never wraps below sm,
            the type is tightened to fit, and the opponent name (the
            only variable-length piece) truncates instead of dropping
            to a second line. Desktop wraps and sizes exactly as before. */}
        <div className="flex flex-nowrap items-center gap-x-2.5 px-3 py-4 sm:flex-wrap sm:gap-x-8 sm:gap-y-4 sm:px-7 sm:py-6">
          <div className="shrink-0">
            <p className="font-condensed text-[1.3rem] font-bold uppercase leading-none sm:text-5xl">
              SYNDICATE
            </p>
          </div>
          <p className="score-pop shrink-0 font-condensed text-[2.1rem] font-bold leading-none sm:text-7xl">
            <span className={isWin ? "text-brand" : "text-ink/50"}>
              {a.finalScore.split(/[–—-]/)[0]?.trim() ?? a.finalScore}
            </span>
            <span className="mx-1 text-ink/30">–</span>
            <span>{a.finalScore.split(/[–—-]/)[1]?.trim() ?? ""}</span>
          </p>
          <span
            className={`chip-shine shrink-0 px-2 py-1 font-condensed text-xs font-bold uppercase tracking-wider text-white sm:px-3 sm:py-1.5 sm:text-lg ${
              isWin ? "bg-brand" : "bg-zinc-600"
            }`}
          >
            {a.result}
          </span>
          <p className="min-w-0 truncate font-condensed text-[1.3rem] font-bold uppercase leading-none text-ink/85 sm:text-5xl">
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

      {/* Opponent Discord bar — same pattern as the channel bar, only
          when a Discord link is on file. Sits right under the channel
          bar when both exist, otherwise in its place. */}
      {a.opponentDiscordUrl && (
        <div
          className={`anim-fade-rise flex flex-wrap items-center gap-3 border border-line bg-card px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 ${
            a.opponentChannelUrl ? "mt-3 sm:mt-4" : "mt-6 sm:mt-8"
          }`}
          style={{ "--anim-delay": "160ms" } as React.CSSProperties}
        >
          <span className="live-dot shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 font-condensed text-lg font-semibold uppercase sm:text-xl">
            {a.opponent} <span className="text-ink/40">— Discord</span>
          </p>
          <a
            href={a.opponentDiscordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center bg-brand px-4 font-condensed text-sm font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:px-5 sm:text-base"
          >
            Visit Discord →
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
          Every game in the match gets its own block — its score, its Victory or
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
              className="sheen-host relative block aspect-video w-full overflow-hidden"
              aria-label={`View game ${g.gameNumber} screenshot large`}
            >
              {/* Optimized variant for the inline view; the lightbox
                  below still opens the original full-size URL. */}
              <Image
                src={g.screenshotUrl}
                alt={`${recordLabel(a)}, game ${g.gameNumber} result screen — ${g.result}, ${g.scoreFor} to ${g.scoreAgainst}`}
                fill
                sizes="(max-width: 768px) 100vw, 1152px"
                className="img-in object-cover transition duration-500 group-hover:scale-[1.02]"
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
          {/* The viewer is one framed unit (Krrish's call, 28 Nov):
              the details bar is stuck to the top edge of the
              screenshot itself instead of floating above it, and a
              thin border in the site's own line grey runs around the
              whole frame. The frame hugs the picture — the img keeps
              its natural aspect inside max bounds below, and the bar
              takes the frame's width via w-0 + min-w-full, so a long
              caption wraps inside the bar instead of widening the
              frame past the picture. The unit is centred in the
              leftover space; the backdrop keeps its blur. */}
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div
              className={`flex max-h-full w-fit max-w-full flex-col border border-line bg-card shadow-[0_8px_40px_rgba(0,0,0,0.65)] ${
                closing ? "lightbox-img-out" : "lightbox-img-in"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Details bar — solid bg-card so the game details stay
                  readable over any screenshot; divider line under it,
                  actions (download, then the red close) on the right. */}
              <div className="flex w-0 min-w-full items-center justify-between gap-3 border-b border-line px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
            <p className="min-w-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-ink/85 sm:text-xs">
              <span className="text-white">
                {recordLabel(a)} · Game {lightbox.gameNumber}
              </span>{" "}
              — {lightbox.result}, {lightbox.scoreFor} – {lightbox.scoreAgainst}{" "}
              · {a.mode}, {a.map}
            </p>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={download}
                disabled={downloading}
                aria-label={`Download game ${lightbox.gameNumber} screenshot`}
                className="flex h-12 w-12 shrink-0 items-center justify-center gap-2 border border-linestrong bg-white/5 font-condensed text-sm font-bold uppercase tracking-wider text-ink transition hover:border-brand hover:text-brand disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-4"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="hidden sm:inline">
                  {downloading ? "Saving…" : "Download"}
                </span>
              </button>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                aria-label="Close screenshot viewer"
                className="flex h-12 w-12 shrink-0 items-center justify-center bg-brand text-2xl font-bold text-white shadow-[0_4px_18px_rgba(0,0,0,0.6)] transition duration-300 hover:rotate-45 hover:bg-branddeep"
              >
                ×
              </button>
            </div>
          </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  lbAttempt === 0
                    ? lightbox.screenshotUrl
                    : `${lightbox.screenshotUrl}${lightbox.screenshotUrl.includes("?") ? "&" : "?"}synretry=${lbAttempt}`
                }
                alt={`Game ${lightbox.gameNumber} result screen, large`}
                className="block h-auto max-h-[calc(100dvh-9rem)] w-auto max-w-full sm:max-h-[calc(100dvh-11rem)]"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
                onError={() => {
                  if (lbAttempt < 2) {
                    lbTimer.current = window.setTimeout(
                      () => setLbAttempt((a) => a + 1),
                      500 * (lbAttempt + 1),
                    );
                  }
                }}
              />
            </div>
          </div>
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
