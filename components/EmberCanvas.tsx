"use client";

import { useEffect, useRef } from "react";

// Rising-ember particle layer for the public site's animated background.
// Deliberately cheap: capped device-pixel-ratio, a small particle budget
// (smaller on phones), paused when the tab is hidden, and fully disabled
// for prefers-reduced-motion.
export default function EmberCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
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
      if (!running) return;
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
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
    />
  );
}
