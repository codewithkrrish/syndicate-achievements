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
// View match action at the bottom. On phones the card stays a
// horizontal list row — compact thumbnail rail on the left, with the
// final-score block and View match folded into the main column —
// never a stacked card.
// Click-to-open is a card-sized button UNDERLAY: the visible content
// sits above it with pointer-events off, so the whole card still
// opens the match. The opponent's channel link lives in the match
// detail view, never on the card face.
export default function RecordCard({ achievement: a, onOpen }: Props) {
  const thumb = thumbnailOf(a);
  const isWin = a.result === "WIN";

  return (
    <article className="group relative border border-line bg-raise transition duration-300 hover:-translate-y-[3px] hover:border-linestrong hover:shadow-[0_14px_34px_rgba(0,0,0,0.45)] active:translate-y-0">
      <button
        type="button"
        onClick={() => onOpen(a.id)}
        className="absolute inset-0 block h-full w-full"
        aria-label={`View match ${matchLabel(a.matchNumber)} against ${a.opponent}`}
      />
      <div className="pointer-events-none relative flex sm:flex-row">
          {/* Thumbnail — fixed box matching the original static design:
              300×188px on desktop; on phones a compact 124px rail that
              stretches to the row height, so the card reads as a list
              row at every width. The frame owns the size; it never
              stretches with the body. */}
          <div className="relative w-[124px] shrink-0 self-stretch overflow-hidden sm:h-[188px] sm:w-[300px] sm:self-start">
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
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-card font-mono text-xs uppercase tracking-widest text-ink/30">
                No screenshot
              </div>
            )}
            <span
              className={`absolute left-2 top-2 px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-sm ${
                isWin ? "bg-brand" : "bg-zinc-600"
              }`}
            >
              {a.result}
            </span>
            <span className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 font-condensed text-base font-bold leading-none text-white sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-lg">
              {a.finalScore}
            </span>
          </div>

          {/* Main column */}
          <div className="min-w-0 flex-1 px-3 pb-3 pt-3 sm:px-[1.15rem] sm:pb-[1.1rem] sm:pt-[1.05rem]">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-brand sm:text-[0.74rem] sm:tracking-[0.2em]">
              Match {matchLabel(a.matchNumber)} · Achievement
            </p>

            {/* Title row — on phones the final-score block sits at the
                top-right of the body, next to the title. From sm up the
                wrapper dissolves (display:contents), the phone score is
                hidden, and the score lives in the side column, exactly
                as the static design. */}
            <div className="flex items-start justify-between gap-2 sm:contents">
              <h3 className="mt-1.5 min-w-0 font-condensed text-[1.45rem] font-bold uppercase leading-none sm:text-4xl">
                SYNDICATE <span className="text-ink/40">vs</span> {a.opponent}
              </h3>
              <div className="shrink-0 pt-1 text-right sm:hidden">
                <span className="block whitespace-nowrap font-condensed text-[1.65rem] font-bold leading-none text-brand">
                  {a.finalScore}
                </span>
                <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink/40">
                  Final score
                </span>
              </div>
            </div>

            <p className="mt-2 max-w-[36rem] text-[0.85rem] leading-normal text-ink/65 sm:text-[0.95rem]">
              {a.cardLine}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line pt-3 sm:mt-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-4 sm:pt-[0.85rem] lg:grid-cols-5">
              <Meta label="Guild / Creator" value={a.opponent} />
              <Meta label="Date" value={formatDate(a.date)} />
              <Meta label="Mode" value={a.mode} />
              <Meta label="Map" value={a.map} />
              <Meta label="Format" value={a.format} />
            </dl>

            {/* View match — phones only, bottom-right of the body. From
                sm up it lives in the side column. */}
            <div className="mt-3 text-right sm:hidden">
              <span className="whitespace-nowrap text-[0.78rem] font-bold uppercase tracking-[0.1em] text-brand">
                View match →
              </span>
            </div>
          </div>

          {/* Side column — final score top-right, View match bottom-right.
              Desktop only; on phones both live in the main column. */}
          <div className="mt-[0.35rem] hidden shrink-0 items-center justify-between gap-4 border-t border-line px-4 py-3 sm:mt-0 sm:flex sm:flex-col sm:items-end sm:justify-between sm:border-t-0 sm:pb-[1.1rem] sm:pl-0 sm:pr-[1.15rem] sm:pt-[1.05rem] sm:text-right">
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
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.8rem] font-medium text-ink/90 sm:text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}
