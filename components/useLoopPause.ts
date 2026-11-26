"use client";

import { useEffect, useRef } from "react";

// Pauses an element's continuous CSS loops while the element is
// off-screen. The loops themselves are plain CSS animations (see the
// "Animation pack" section in app/globals.css); this hook only toggles
// the .loop-offscreen class on the observed element, and the CSS pauses
// any .anim-loop (or named loop pseudo-element) inside it via
// animation-play-state. Transform/opacity animations only — pausing
// never shifts layout. Tab-hidden pausing is global instead: PublicSite
// toggles .tab-hidden on <html>.
export function useLoopPause<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          el.classList.toggle("loop-offscreen", !entry.isIntersecting);
        }
      },
      // A small margin so a loop resumes just before its section
      // scrolls back into view, never mid-frame.
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("loop-offscreen");
    };
  }, []);

  return ref;
}
