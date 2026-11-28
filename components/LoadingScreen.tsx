"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Branded loading screen. The archive used to assemble itself in front of
// the visitor — hero fading in, screenshots popping one by one — which
// read as broken even when nothing was wrong. Now the site loads behind
// this screen and is only revealed once it is actually ready.
//
// "Ready" is measured, not guessed: the progress bar is driven by real
// milestones (document parsed, webfonts in, window load fired — which
// includes the opening images), eases towards the furthest milestone
// reached, and the screen lifts only after 100% AND a short minimum
// dwell, so it never flashes. A hard fail-safe lifts it at 4s whatever
// happens: a slow network must never trap a visitor behind a loader.
// Public pages only — the admin panel opens straight to the sign-in.
const MIN_DWELL_MS = 750;
const FAILSAFE_MS = 4000;
const EXIT_MS = 550;

export default function LoadingScreen() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const targetRef = useRef(0);
  const startedRef = useRef<number>(Date.now());
  const prevOverflowRef = useRef("");

  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return;
    startedRef.current = Date.now();

    // Scroll stays locked while the screen is up; restored the moment
    // it starts leaving (the component stays mounted after it fades,
    // so the exit path — not just unmount cleanup — must restore it).
    const root = document.documentElement;
    prevOverflowRef.current = root.style.overflow;
    root.style.overflow = "hidden";

    const bump = (value: number) => {
      targetRef.current = Math.max(targetRef.current, value);
    };

    if (document.readyState !== "loading") bump(30);
    else
      document.addEventListener(
        "DOMContentLoaded",
        () => bump(30),
        { once: true },
      );
    // The condensed display font swapping in late is the most visible
    // "still loading" tell on this site, so fonts are a real milestone.
    document.fonts?.ready.then(() => bump(60)).catch(() => {});
    if (document.readyState === "complete") bump(100);
    else window.addEventListener("load", () => bump(100), { once: true });
    // Fail-safe: snap straight to 100 so the screen lifts at ~4s even
    // on a connection where the load event never quite lands.
    const failsafe = window.setTimeout(() => {
      bump(100);
      setProgress(100);
    }, FAILSAFE_MS);

    // Ease the displayed number towards the furthest milestone reached.
    // While the page is still loading it may creep to 92 on its own —
    // a bar frozen at one number reads as hung — but only a real
    // window-load (or the fail-safe) may take it to 100, and the final
    // approach runs faster so a loaded page is revealed promptly.
    const tick = window.setInterval(() => {
      setProgress((current) => {
        const done = targetRef.current >= 100;
        const ceiling = done ? 100 : 92;
        const goal = Math.min(targetRef.current, ceiling);
        const effective = Math.max(goal, Math.min(current + 0.8, ceiling));
        if (current >= effective) return current;
        const step = Math.max(1.2, (effective - current) * (done ? 0.35 : 0.18));
        return Math.min(current + step, effective);
      });
    }, 90);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(failsafe);
      root.style.overflow = prevOverflowRef.current;
    };
  }, [isAdmin]);

  // Completion: real 100% plus the minimum dwell, then fade and unmount.
  useEffect(() => {
    if (isAdmin || progress < 100 || leaving) return;
    const wait = Math.max(0, MIN_DWELL_MS - (Date.now() - startedRef.current));
    const t = window.setTimeout(() => {
      document.documentElement.style.overflow = prevOverflowRef.current;
      setLeaving(true);
      window.setTimeout(() => setGone(true), EXIT_MS);
    }, wait);
    return () => window.clearTimeout(t);
  }, [progress, leaving, isAdmin]);

  if (isAdmin || gone) return null;

  const shown = Math.floor(progress);

  return (
    <div
      id="syn-loader"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#050506",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: leaving ? 0 : 1,
        visibility: leaving ? "hidden" : "visible",
        transition: `opacity 0.5s ease, visibility 0s linear ${leaving ? "0.5s" : "0s"}`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div className="flex flex-col items-center px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/guild-logo.webp"
          alt=""
          width={84}
          height={84}
          className="loader-pulse h-[84px] w-[84px] object-contain"
          draggable={false}
        />
        <p className="mt-6 font-condensed text-4xl font-bold uppercase leading-none tracking-wide text-ink sm:text-5xl">
          Syndicate
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.42em] text-brand">
          Achievements
        </p>
        <div className="mt-9 h-[3px] w-[220px] overflow-hidden bg-white/10">
          <div
            className="h-full bg-brand transition-[width] duration-150 ease-out"
            style={{ width: `${shown}%` }}
          />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/50">
          Loading the archive · {shown}%
        </p>
      </div>
    </div>
  );
}
