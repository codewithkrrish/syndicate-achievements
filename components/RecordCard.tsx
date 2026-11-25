"use client";

import type { AchievementDTO } from "@/lib/types";
import { formatDate, matchLabel, thumbnailOf } from "@/lib/format";

interface Props {
  achievement: AchievementDTO;
  onOpen: (id: number) => void;
}

// One entry in The Record. Thumbnail (decider screenshot) with result badge
// and score overlay, then title, the short card line, the meta grid, and the
// View match action. The whole card is a button — one tap target, no nested
// interactive elements.
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
          {/* Thumbnail */}
          <div className="relative shrink-0 overflow-hidden sm:w-72 lg:w-80">
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
                className="img-in aspect-video h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-video h-full w-full items-center justify-center bg-card font-mono text-xs uppercase tracking-widest text-ink/30">
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

          {/* Body */}
          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-brand">
              Match {matchLabel(a.matchNumber)}
            </p>
            <h3 className="mt-1.5 font-condensed text-3xl font-bold uppercase leading-none sm:text-4xl">
              SYNDICATE <span className="text-ink/40">vs</span> {a.opponent}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink/65">
              {a.cardLine}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-5">
              <Meta label="Guild / Creator" value={a.opponent} />
              <Meta label="Date" value={formatDate(a.date)} />
              <Meta label="Mode" value={a.mode} />
              <Meta label="Map" value={a.map} />
              <Meta label="Format" value={a.format} />
            </dl>

            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="font-condensed text-2xl font-bold leading-none">
                <span className={isWin ? "text-brand" : "text-ink/60"}>
                  {a.finalScore}
                </span>
              </span>
              <span className="font-condensed text-base font-semibold uppercase tracking-wider text-ink/70 transition group-hover:text-brand">
                View match →
              </span>
            </div>
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
