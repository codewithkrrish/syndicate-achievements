"use client";

import { useEffect, useRef } from "react";

// Rising-ember particle layer, mounted ONLY inside the home hero —
// the canvas is absolutely positioned within the hero section (which
// clips it with overflow-hidden), so embers can never drift over the
// rest of the page or appear at the screen edges further down.
// Deliberately cheap: capped device-pixel-ratio, a small particle
// budget (smaller on phones), drawing paused when the tab is hidden
// or the hero is off-screen, and fully disabled for
// prefers-reduced-motion.
export default function EmberCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true; // tab visible
    let inView = true; // hero on screen
    let w = 0;
    let h = 0;

    interface Ember {
      x: number;
      y: number;
      r: number;
      speed: number;
      sway: number;
      phase: number;
      alpha: number;
    }
    let embers: Ember[] = [];

    const resize = () => {
      // Size to the hero container, never the window: the canvas is
      // confined to the hero box, so its particles stay inside it.
      const host = canvas.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? 26 : 44;
      embers = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.7,
        speed: 0.25 + Math.random() * 0.75,
        sway: 10 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.5,
      }));
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!running || !inView) return;
      ctx.clearRect(0, 0, w, h);
      for (const e of embers) {
        e.y -= e.speed;
        if (e.y < -6) {
          e.y = h + 6;
          e.x = Math.random() * w;
        }
        const x = e.x + Math.sin(t / 1600 + e.phase) * (e.sway / 10);
        ctx.beginPath();
        ctx.arc(x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 80, 60, ${e.alpha})`;
        ctx.fill();
      }
    };

    const onVisibility = () => {
      running = !document.hidden;
    };

    resize();
    raf = requestAnimationFrame(tick);

    // Re-measure when the hero box itself changes size, and only draw
    // while the hero is actually on screen.
    const host = canvas.parentElement;
    const ro =
      host && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resize)
        : null;
    if (host && ro) ro.observe(host);
    else window.addEventListener("resize", resize);
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            inView = entries[0]?.isIntersecting ?? true;
          })
        : null;
    if (io) io.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      if (io) io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    />
  );
}
