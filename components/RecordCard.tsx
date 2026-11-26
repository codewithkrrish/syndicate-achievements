"use client";

import type { AchievementDTO } from "@/lib/types";
import { formatDate, matchLabel, thumbnailOf } from "@/lib/format";

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

  return (
    <article className="group border border-line bg-raise transition duration-300 hover:-translate-y-[3px] hover:border-linestrong hover:shadow-[0_14px_34px_rgba(0,0,0,0.45)] active:translate-y-0">
      <button
        type="button"
        onClick={() => onOpen(a.id)}
        className="block w-full text-left"
        aria-label={`View match ${matchLabel(a.matchNumber)} against ${a.opponent}`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail — fixed box matching the original static design:
              300×188px on desktop, full-width 16:9 when stacked on mobile.
              The frame owns the size; it never stretches with the body. */}
          <div className="relative aspect-video w-full shrink-0 self-start overflow-hidden sm:aspect-auto sm:h-[188px] sm:w-[300px]">
            {thumb ? (
              // Plain <img>: screenshot URLs are admin-managed (Blob or any
              // pasted URL), so next/image host restrictions don't apply here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt={
                  a.thumbnailUrl
                    ? `SYNDICATE vs ${a.opponent} — match poster`
                    : `${a.opponent} — deciding game screenshot`
                }
                className="img-in h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-card font-mono text-xs uppercase tracking-widest text-ink/30">
                No screenshot
              </div>
            )}
            <span
              className={`absolute left-3 top-3 px-2.5 py-1 font-condensed text-sm font-bold uppercase tracking-wider text-white ${
                isWin ? "bg-brand" : "bg-zinc-600"
              }`}
            >
              {a.result}
            </span>
            <span className="absolute bottom-3 right-3 bg-black/75 px-2.5 py-1 font-condensed text-lg font-bold leading-none text-white">
              {a.finalScore}
            </span>
          </div>

          {/* Main column */}
          <div className="min-w-0 flex-1 px-4 pb-[0.4rem] pt-4 sm:px-[1.15rem] sm:pb-[1.1rem] sm:pt-[1.05rem]">
            <p className="text-[0.74rem] font-bold uppercase tracking-[0.2em] text-brand">
              Match {matchLabel(a.matchNumber)} · Achievement
            </p>
            <h3 className="mt-1.5 font-condensed text-3xl font-bold uppercase leading-none sm:text-4xl">
              SYNDICATE <span className="text-ink/40">vs</span> {a.opponent}
            </h3>
            <p className="mt-2 max-w-[36rem] text-[0.95rem] leading-normal text-ink/65">
              {a.cardLine}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-[0.85rem] sm:grid-cols-3 lg:grid-cols-5">
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
          <div className="mt-[0.35rem] flex shrink-0 items-center justify-between gap-4 border-t border-line px-4 py-3 sm:mt-0 sm:flex-col sm:items-end sm:justify-between sm:border-t-0 sm:pb-[1.1rem] sm:pl-0 sm:pr-[1.15rem] sm:pt-[1.05rem] sm:text-right">
            <div className="flex items-baseline gap-2 sm:block">
              <span className="whitespace-nowrap font-condensed text-[2rem] font-bold leading-none text-brand">
                {a.finalScore}
              </span>
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink/40 sm:mt-[0.3rem] sm:block">
                Final score
              </span>
            </div>
            <span className="whitespace-nowrap text-[0.84rem] font-bold uppercase tracking-[0.1em] text-brand">
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
      <dd className="mt-0.5 truncate text-sm font-medium text-ink/90" title={value}>
        {value}
      </dd>
    </div>
  );
}
