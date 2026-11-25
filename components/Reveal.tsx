"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// useLayoutEffect on the client (so the hidden state is applied before the
// browser paints — no flash of visible content), plain useEffect on the
// server, where layout effects do not run anyway.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Props {
  children: ReactNode;
  /** Entrance stagger, in milliseconds. */
  delay?: number;
  className?: string;
}

// One-shot entrance wrapper — the scroll-reveal half of the site's motion
// system (see the "Motion system" section in app/globals.css).
//
// Safety first: the wrapper renders its children fully visible. Only after
// mount, on the client, does it briefly apply the hidden state and then
// reveal — immediately for elements already in the viewport (the page-open
// cascade), or when an IntersectionObserver sees the element scroll in.
// If JavaScript never runs, or reduced motion is preferred, nothing is
// ever hidden.
export default function Reveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [shown, setShown] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setHidden(true);

    // Already on screen: play the entrance right away (double rAF so the
    // hidden state is committed before the transition starts).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    // Below the fold: reveal once when scrolled into view, then stop
    // observing — the animation never replays.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${hidden && !shown ? " reveal-hidden" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
