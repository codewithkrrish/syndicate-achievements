"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AchievementDTO } from "@/lib/types";
import { formatDate, matchLabel, thumbnailOf } from "@/lib/format";

interface Props {
  achievements: AchievementDTO[];
  query: string;
  onQueryChange: (q: string) => void;
  onOpen: (id: number) => void;
  /** Lets the hosting page focus this input (e.g. after clearing). */
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/** Opponent name with the typed query highlighted (red, bold). */
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="hl">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// Real-time guild search. Every keystroke filters the record list below
// (handled by the parent via onQueryChange) AND updates this live results
// dropdown. Keyboard: ArrowUp/ArrowDown + Enter, Escape closes.
export default function SearchBar({
  achievements,
  query,
  onQueryChange,
  onOpen,
  inputRef,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return achievements.filter((a) => a.opponent.toLowerCase().includes(q));
  }, [achievements, query]);

  const open = focused && query.trim().length > 0;

  useEffect(() => setActive(0), [query]);

  // Click/tap outside closes the dropdown.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (id: number) => {
    setFocused(false);
    onOpen(id);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-stretch border border-linestrong bg-raise transition duration-300 focus-within:border-brand focus-within:shadow-[0_0_24px_rgba(229,50,45,0.18)]">
        <span className="flex items-center pl-4 text-ink/50" aria-hidden>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="guild-search"
          type="text"
          value={query}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search by guild or creator name"
          aria-label="Search achievements by guild or creator name"
          aria-expanded={open}
          aria-controls="live-results"
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none placeholder:text-ink/35"
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && matches.length) {
              e.preventDefault();
              setActive((a) => (a + 1) % matches.length);
            } else if (e.key === "ArrowUp" && matches.length) {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
            } else if (e.key === "Enter" && open && matches[active]) {
              e.preventDefault();
              choose(matches[active].id);
            } else if (e.key === "Escape") {
              if (open) setFocused(false);
              else onQueryChange("");
            }
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            className="shrink-0 px-4 font-condensed text-sm font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status line: result count, announced politely to screen readers. */}
      <p aria-live="polite" className="mt-2 min-h-5 font-mono text-xs text-ink/45">
        {query.trim()
          ? matches.length === 1
            ? "1 match found"
            : `${matches.length} matches found`
          : ""}
      </p>

      {open && (
        <div
          id="live-results"
          role="listbox"
          className="dropdown-in thin-scroll absolute inset-x-0 top-full z-40 mt-1 max-h-[min(26rem,calc(100dvh-11rem))] overflow-y-auto border border-linestrong bg-card shadow-panel"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="live-dot" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60">
              Live results
            </span>
            <span className="ml-auto font-mono text-[11px] text-ink/40">
              {matches.length}
            </span>
          </div>
          {matches.length === 0 ? (
            <p className="px-4 py-5 text-sm text-ink/55">
              No guild matches &ldquo;{query.trim()}&rdquo; in the record yet.
            </p>
          ) : (
            matches.map((a, i) => {
              const thumb = thumbnailOf(a);
              return (
                <button
                  key={a.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(a.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    i === active ? "bg-brand/10" : "bg-transparent"
                  }`}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="aspect-video w-20 shrink-0 border border-line object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="aspect-video w-20 shrink-0 border border-line bg-raise" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-condensed text-lg font-semibold uppercase leading-tight">
                      <Highlighted text={a.opponent} query={query} />
                    </span>
                    <span className="block truncate text-xs text-ink/50">
                      {matchLabel(a.matchNumber)} · {formatDate(a.date)} · {a.mode} ·{" "}
                      {a.map} · {a.format}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`block font-condensed text-xl font-bold leading-none ${
                        a.result === "WIN" ? "text-brand" : "text-ink/60"
                      }`}
                    >
                      {a.finalScore}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                      {a.result}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
