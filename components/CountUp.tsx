"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** The final number to count up to. */
  value: number;
  duration?: number;
  className?: string;
}

// Counts 0 → value once, the first time the number scrolls into view
// (hero stats). Safety first, same contract as Reveal: the server-rendered
// output is the real final value, so no-JS visitors and screen readers
// always see the truth; the count-up only replays it visually for
// motion-OK visitors with JS. Reduced motion never counts.
export default function CountUp({ value, duration = 1100, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    // JS is running and motion is welcome: start from 0 and count up
    // when the number first becomes visible.
    setDisplay(0);
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
