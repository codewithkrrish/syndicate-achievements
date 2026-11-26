"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AchievementDTO } from "@/lib/types";
import { formatDate, recordLabel, thumbnailOf } from "@/lib/format";

interface Props {
  achievement: AchievementDTO;
  onOpen: (id: number) => void;
}

// One entry in The Record, laid out exactly like the original static
// design: thumbnail (decider screenshot) with result badge and score
// overlay, then the main column (kicker, title, card line, meta grid),
// then a right side column with the final-score block on top and the
// View match action at the bottom. The whole card is a button — one tap
// target, no nested interactive elements.
export default function RecordCard({ achievement: a, onOpen }: Props) {
  const thumb = thumbnailOf(a);
  const isWin = a.result === "WIN";
  const articleRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // One observer, two jobs: fire the one-shot entrance effects (sheen
  // sweep, WIN badge pop) the first time the card arrives, and pause the
  // badge's pulse loop whenever the card is off-screen.
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        el.classList.toggle("loop-offscreen", !entry.isIntersecting);
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={articleRef}
      className={`group sheen-host border border-line bg-raise transition duration-300 hover:-translate-y-[3px] hover:border-linestrong hover:shadow-[0_14px_34px_rgba(0,0,0,0.45)] active:translate-y-0${
        inView ? " card-inview" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(a.id)}
        className="block w-full text-left"
        aria-label={`View ${recordLabel(a)} against ${a.opponent}`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail — fixed box matching the original static design:
              300×188px on desktop, full-width 16:9 when stacked on mobile.
              The frame owns the size; it never stretches with the body. */}
          <div className="relative aspect-video w-full shrink-0 self-start overflow-hidden sm:aspect-auto sm:h-[188px] sm:w-[300px]">
            {thumb ? (
              // next/image: the optimizer serves a right-sized WebP/AVIF
              // variant of the screenshot (full-size originals stay behind
              // /api/images for the lightbox). The frame owns the size —
              // fill + object-cover keeps the exact settled crop.
              <Image
                src={thumb}
                alt={
                  a.thumbnailUrl
                    ? `SYNDICATE vs ${a.opponent} — match poster`
                    : `${a.opponent} — deciding game screenshot`
                }
                fill
                sizes="(max-width: 639px) 100vw, 300px"
                className="img-in object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-card font-mono text-xs uppercase tracking-widest text-ink/30">
                No screenshot
              </div>
            )}
            <span
              className={`absolute left-3 top-3 px-2.5 py-1 font-condensed text-[13px] font-bold uppercase tracking-wider text-white sm:text-sm ${
                isWin ? "bg-brand badge-fx anim-loop" : "bg-zinc-600"
              }`}
            >
              {a.result}
            </span>
            <span className="absolute bottom-3 right-3 bg-black/75 px-2.5 py-1 font-condensed text-base font-bold leading-none text-white sm:text-lg">
              {a.finalScore}
            </span>
            {/* Light sweep across the thumbnail — plays once when the
                card arrives and again on hover (see .card-sheen). */}
            <span aria-hidden className="card-sheen" />
          </div>

          {/* Main column */}
          <div className="min-w-0 flex-1 px-3.5 pb-[0.4rem] pt-3.5 sm:px-[1.15rem] sm:pb-[1.1rem] sm:pt-[1.05rem]">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-brand sm:text-[0.74rem]">
              {recordLabel(a)}
            </p>
            <h3 className="mt-1 font-condensed text-[1.55rem] font-bold uppercase leading-none sm:mt-1.5 sm:text-4xl">
              SYNDICATE <span className="text-ink/40">vs</span> {a.opponent}
            </h3>
            <p className="mt-1.5 max-w-[36rem] text-[0.875rem] leading-normal text-ink/65 sm:mt-2 sm:text-[0.95rem]">
              {a.cardLine}
            </p>

            <dl className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-line pt-3 sm:mt-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-4 sm:pt-[0.85rem] lg:grid-cols-5">
              <Meta label="Guild / Creator" value={a.opponent} />
              <Meta label="Date" value={formatDate(a.date)} />
              <Meta label="Mode" value={a.mode} />
              <Meta label="Map" value={a.map} />
              <Meta label="Format" value={a.format} />
            </dl>
          </div>

          {/* Side column — final score top-right, View match bottom-right.
              On mobile it becomes a bottom row under a divider, like the
              static design. */}
          <div className="mt-[0.35rem] flex shrink-0 items-center justify-between gap-4 border-t border-line px-3.5 py-2.5 sm:mt-0 sm:flex-col sm:items-end sm:justify-between sm:border-t-0 sm:pb-[1.1rem] sm:pl-0 sm:pr-[1.15rem] sm:pt-[1.05rem] sm:text-right">
            <div className="flex items-baseline gap-2 sm:block">
              <span className="whitespace-nowrap font-condensed text-[1.65rem] font-bold leading-none text-brand sm:text-[2rem]">
                {a.finalScore}
              </span>
              <span className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-ink/40 sm:mt-[0.3rem] sm:block sm:text-[0.7rem]">
                Final score
              </span>
            </div>
            <span className="whitespace-nowrap text-[0.78rem] font-bold uppercase tracking-[0.1em] text-brand sm:text-[0.84rem]">
              View match →
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13px] font-medium text-ink/90 sm:text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}
