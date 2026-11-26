"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AchievementDTO } from "@/lib/types";
import SiteHeader from "./SiteHeader";
import SiteFooter, { SiteBackdrop } from "./SiteFooter";
import SearchBar from "./SearchBar";
import RecordCard from "./RecordCard";
import Reveal from "./Reveal";
import MatchDetail from "./MatchDetail";

const META = {
  CREATOR: {
    navKey: "creators",
    number: "01",
    title: "Creators Record",
    blurb:
      "Records filed against creator-led teams — opponents who run a YouTube or Instagram channel.",
  },
  ORDINARY: {
    navKey: "ordinary",
    number: "02",
    title: "Ordinary Record",
    blurb: "Records filed against regular in-game guilds.",
  },
} as const;

// One collection's own page: its heading and filing rule, a search box
// that filters ONLY this collection's records, and the full card list.
// A card opens the match detail right here; Back returns to this page's
// list. The header's global search is gone for good — search lives on
// the collection pages, scoped to the collection.
export default function CategoryPage({
  category,
  achievements,
}: {
  category: "CREATOR" | "ORDINARY";
  achievements: AchievementDTO[];
}) {
  const meta = META[category];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Anything not filed as CREATOR reads as Ordinary — the same rule the
  // home summaries use, so a record can never fall out of both pages.
  const records = useMemo(
    () =>
      category === "CREATOR"
        ? achievements.filter((a) => a.category === "CREATOR")
        : achievements.filter((a) => a.category !== "CREATOR"),
    [achievements, category],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((a) => a.opponent.toLowerCase().includes(q));
  }, [records, query]);

  const selected =
    selectedId !== null
      ? (records.find((a) => a.id === selectedId) ?? null)
      : null;

  // Opening or leaving a match starts from the top of the page body
  // (but the page's first mount leaves the scroll position alone).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.scrollIntoView({ block: "start" });
  }, [selectedId]);

  return (
    <div className="relative min-h-dvh">
      <SiteBackdrop />
      <SiteHeader active={meta.navKey as "creators" | "ordinary"} />

      <main ref={mainRef} className="relative z-10 scroll-mt-20">
        {selected ? (
          <div className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
            <MatchDetail
              achievement={selected}
              onBack={() => setSelectedId(null)}
            />
          </div>
        ) : (
          <div className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
            <div className="anim-fade-rise flex items-baseline gap-3 sm:gap-4">
              <span className="font-mono text-xs text-brand sm:text-sm">
                {meta.number}
              </span>
              <h1 className="font-condensed text-[1.75rem] font-bold uppercase leading-none sm:text-5xl">
                {meta.title}
              </h1>
            </div>
            <p
              className="anim-fade-rise mt-2.5 max-w-2xl text-[13px] leading-relaxed text-ink/55 sm:mt-3 sm:text-[15px]"
              style={{ "--anim-delay": "60ms" } as React.CSSProperties}
            >
              {meta.blurb}
            </p>

            {/* This collection's own search — it can only ever surface
                records filed on this page. */}
            <Reveal className="mt-6 sm:mt-7" delay={60}>
              <SearchBar
                achievements={records}
                query={query}
                onQueryChange={setQuery}
                onOpen={setSelectedId}
                inputRef={searchRef}
              />
            </Reveal>

            <div className="mt-4 space-y-4">
              {records.length === 0 ? (
                <Reveal>
                  <div className="border border-dashed border-linestrong bg-raise px-5 py-9 text-center sm:px-6 sm:py-11">
                    <p className="font-condensed text-xl font-bold uppercase sm:text-2xl">
                      No records filed yet
                    </p>
                    <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink/55 sm:text-sm">
                      Nothing has been filed in this collection yet. When the
                      guild files a record here, it will show with its score
                      and result screens.
                    </p>
                  </div>
                </Reveal>
              ) : filtered.length === 0 ? (
                <Reveal>
                  <div className="border border-dashed border-linestrong bg-raise px-5 py-11 text-center sm:px-6 sm:py-14">
                    <p className="font-condensed text-2xl font-bold uppercase sm:text-3xl">
                      No guild found
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink/55 sm:text-sm">
                      Nothing in this collection matches &ldquo;
                      {query.trim()}&rdquo;. Check the name, or clear the
                      search to see every record filed here.
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
                    <RecordCard achievement={a} onOpen={setSelectedId} />
                  </Reveal>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <SiteFooter achievements={achievements} />
    </div>
  );
}
