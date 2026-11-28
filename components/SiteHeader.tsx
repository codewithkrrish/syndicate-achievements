"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type NavKey = "creators" | "ordinary" | "about";

// The site header, shared by the home page and the two record pages.
// Owns the scroll effects (depth shadow + top progress line) and the
// hidden-tab loop pause, since it is mounted on every public page.
// Nav is real links to the record pages; About is an in-page view on
// the home page (onAbout) and a link back to it from anywhere else.
export default function SiteHeader({
  active,
  onAbout,
  onHome,
}: {
  active: NavKey | null;
  onAbout?: () => void;
  onHome?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Header scroll state (depth shadow) + the top scroll-progress line.
  // The progress bar is mutated directly through its ref — no React
  // re-render per scroll frame — and the shadow state only flips when
  // the page crosses the threshold, so scrolling stays cheap.
  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const isScrolled = y > 8;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(y / max, 1) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Hidden tabs pause every continuous CSS loop (see .tab-hidden in
  // globals.css). The ember canvas pauses itself the same way.
  useEffect(() => {
    const onVisibility = () =>
      document.documentElement.classList.toggle("tab-hidden", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const brandInner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/guild-logo.webp"
        alt=""
        width={40}
        height={40}
        decoding="async"
        className="logo-glow anim-loop h-8 w-8 shrink-0 object-cover sm:h-10 sm:w-10"
      />
      <span className="leading-none">
        <span className="block font-condensed text-[17px] font-bold uppercase tracking-wide sm:text-[22px]">
          SYNDICATE
        </span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.3em] text-ink/55 sm:text-[10px] sm:tracking-[0.34em]">
          Achievements
        </span>
      </span>
    </>
  );
  const brandCls =
    "flex min-w-0 items-center gap-2.5 py-2.5 text-left sm:gap-3 sm:py-3";

  return (
    <header
      className={`anim-fade-in sticky top-0 z-50 border-b border-line bg-bg/88 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_12px_32px_rgba(0,0,0,0.5)]" : ""
      }`}
    >
      {/* Scroll progress — a thin red line at the very top, filled by
          the scroll listener through a ref (transform only). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        aria-hidden
      >
        <div
          ref={progressRef}
          className="h-full origin-left bg-brand"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col px-3 sm:flex-row sm:items-stretch sm:gap-2 sm:px-6">
        {onHome ? (
          <button
            type="button"
            onClick={onHome}
            className={brandCls}
            aria-label="SYNDICATE Achievements — home"
          >
            {brandInner}
          </button>
        ) : (
          <Link href="/" className={brandCls} aria-label="SYNDICATE Achievements — home">
            {brandInner}
          </Link>
        )}
        {/* The two record collections + About. On phones the three
            longer labels get their own row under the brand — one line
            each, nothing squeezed; from sm up it is a single row. */}
        <nav
          className="flex items-stretch border-t border-line/60 sm:ml-auto sm:border-t-0"
          aria-label="Site"
        >
          <NavItem href="/creators-record" active={active === "creators"}>
            Creators Record
          </NavItem>
          <NavItem href="/ordinary-record" active={active === "ordinary"}>
            Ordinary Record
          </NavItem>
          {onAbout ? (
            <NavItem onClick={onAbout} active={active === "about"}>
              About Us
            </NavItem>
          ) : (
            <NavItem href="/#about" active={active === "about"}>
              About Us
            </NavItem>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavItem({
  children,
  href,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const cls = `nav-btn relative flex min-h-10 items-center whitespace-nowrap px-1.5 font-condensed text-xs font-semibold uppercase tracking-wider transition sm:min-h-11 sm:px-4 sm:text-base ${
    active ? "text-ink" : "text-ink/60 hover:text-ink"
  }`;
  const underline = (
    <span
      aria-hidden
      className={`nav-underline${active ? " nav-underline-active" : ""}`}
    />
  );
  if (href) {
    return (
      // A real Next Link, not a plain anchor: the destination is
      // prefetched while it sits on screen, so the tap swaps pages
      // in place instead of reloading the whole site every time.
      <Link href={href} className={cls} aria-current={active ? "page" : undefined}>
        {children}
        {underline}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
      {underline}
    </button>
  );
}
