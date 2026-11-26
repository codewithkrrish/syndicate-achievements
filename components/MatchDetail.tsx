"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AchievementDTO, GameDTO } from "@/lib/types";
import { formatDate, matchLabel, matchNumberPadded } from "@/lib/format";
import { FORMAT_LABEL, type Format } from "@/lib/validation";

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
        className="anim-fade-rise font-condensed text-base font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand"
      >
        ← Back to the record
      </button>

      <div
        className="anim-fade-rise mt-6 flex items-baseline gap-4"
        style={{ "--anim-delay": "60ms" } as React.CSSProperties}
      >
        <span className="font-mono text-sm text-brand">
          {matchNumberPadded(a.matchNumber)}
        </span>
        <h2 className="font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
          Match {matchLabel(a.matchNumber)} — In Full
        </h2>
      </div>

      {/* Scoreline */}
      <div
        className="anim-fade-rise mt-8 border border-line border-l-4 border-l-brand bg-raise shadow-panel"
        style={{ "--anim-delay": "120ms" } as React.CSSProperties}
      >
        <p className="border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50 sm:px-7">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand align-middle" />
          Match {matchLabel(a.matchNumber)} · Filed from the #achievement channel
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-6 sm:px-7">
          <div>
            <p className="font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
              SYNDICATE
            </p>
          </div>
          <p className="font-condensed text-6xl font-bold leading-none sm:text-7xl">
            <span className={isWin ? "text-brand" : "text-ink/50"}>
              {a.finalScore.split("–")[0]?.trim() ?? a.finalScore}
            </span>
            <span className="mx-1 text-ink/30">–</span>
            <span>{a.finalScore.split("–")[1]?.trim() ?? ""}</span>
          </p>
          <span
            className={`px-3 py-1.5 font-condensed text-lg font-bold uppercase tracking-wider text-white ${
              isWin ? "bg-brand" : "bg-zinc-600"
            }`}
          >
            {a.result}
          </span>
          <p className="font-condensed text-4xl font-bold uppercase leading-none text-ink/85 sm:text-5xl">
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
          className="anim-fade-rise mt-8 flex flex-wrap items-center gap-4 border border-line bg-card px-5 py-4"
          style={{ "--anim-delay": "140ms" } as React.CSSProperties}
        >
          <span className="live-dot shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 font-condensed text-xl font-semibold uppercase">
            {a.opponent} <span className="text-ink/40">— YouTube Channel</span>
          </p>
          <a
            href={a.opponentChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center bg-brand px-5 font-condensed text-base font-bold uppercase tracking-wider text-white transition hover:bg-branddeep"
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
        <h3 className="mt-12 font-condensed text-3xl font-bold uppercase">
          Per-game breakdown
        </h3>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/60">
          Every game in the series gets its own block — its score, its Victory or
          Defeat label, and its own result screen. Tap any screenshot to view it
          large.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {a.games.map((g, i) => (
          <article
            key={g.id}
            className="anim-fade-rise border border-line bg-raise"
            style={
              {
                "--anim-delay": `${220 + Math.min(i * 80, 240)}ms`,
              } as React.CSSProperties
            }
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
              <h4 className="font-condensed text-2xl font-bold uppercase">
                Game {g.gameNumber}
              </h4>
              <span
                className={`px-2.5 py-1 font-condensed text-sm font-bold uppercase tracking-wider text-white ${
                  g.result === "Victory" ? "bg-brand" : "bg-zinc-600"
                }`}
              >
                {g.result}
              </span>
              <span className="ml-auto font-condensed text-3xl font-bold leading-none">
                {g.scoreFor} <span className="text-ink/30">–</span> {g.scoreAgainst}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(g)}
              className="block w-full"
              aria-label={`View game ${g.gameNumber} screenshot large`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.screenshotUrl}
                alt={`Match ${matchLabel(a.matchNumber)}, game ${g.gameNumber} result screen — ${g.result}, ${g.scoreFor} to ${g.scoreAgainst}`}
                className="img-in aspect-video w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
            <p className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45">
              {a.mode} · {a.map} · {g.result} {g.scoreFor} – {g.scoreAgainst}
            </p>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-10 font-condensed text-base font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand"
      >
        ← Back to the record
      </button>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Game ${lightbox.gameNumber} screenshot`}
          className={`fixed inset-0 z-[80] flex flex-col bg-black/92 p-4 backdrop-blur-sm sm:p-8 ${
            closing ? "lightbox-out" : "lightbox-in"
          }`}
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70">
              Match {matchLabel(a.matchNumber)} · Game {lightbox.gameNumber} —{" "}
              {lightbox.result}, {lightbox.scoreFor} – {lightbox.scoreAgainst} ·{" "}
              {a.mode}, {a.map}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close screenshot viewer"
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-linestrong text-2xl text-ink transition hover:border-brand hover:text-brand"
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
        </div>
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
      className={`border-line px-5 py-4 [&:not(:last-child)]:border-r max-md:[&:nth-child(2)]:border-r-0 ${className}`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-medium text-ink/95">{value}</dd>
    </div>
  );
}
