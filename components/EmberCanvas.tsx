"use client";

import { useEffect, useRef } from "react";

// Rising-ember particle layer, mounted site-wide inside the shared
// backdrop (SiteBackdrop): the canvas fills the backdrop's fixed,
// overflow-hidden wrapper, so it is clipped to exactly the viewport
// box and can never widen the page or paint past the screen edges.
// (It was briefly confined to the home hero after stray dots were
// seen at the page sides on phones — those turned out to come from
// an unclipped footer decoration, fixed separately; with that gone,
// the flakes are back everywhere Krrish wanted them.)
// Deliberately cheap: capped device-pixel-ratio, a small particle
// budget (smaller on phones, where it should read as subtle ambience
// rather than noise), drawing paused when the tab is hidden, and
// fully disabled for prefers-reduced-motion.
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
    let inView = true; // canvas on screen
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
      // Size to the backdrop wrapper — the fixed, viewport-sized box
      // that clips this canvas — so particles are only ever drawn
      // inside the visible screen area.
      const host = canvas.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? 20 : 40;
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

    // Re-measure when the backdrop box itself changes size (viewport
    // resizes / rotations), and only draw while on screen.
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
