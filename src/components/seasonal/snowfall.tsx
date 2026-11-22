"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number; // radius, px
  vy: number; // fall speed, px per frame at 60fps
  drift: number; // sideways sway amplitude
  phase: number; // where in the sway cycle it starts
  alpha: number;
};

// Fewer flakes on small screens: less to draw on weaker phones, and a phone
// screen covered at desktop density looks like a blizzard.
function flakeCount(width: number): number {
  if (width < 640) return 40;
  if (width < 1080) return 70;
  return 110;
}

function makeFlake(width: number, height: number, anywhere: boolean): Flake {
  const r = 1 + Math.random() * 2.6;
  return {
    x: Math.random() * width,
    // New flakes start just above the top; the first batch is scattered over
    // the whole screen so the effect doesn't begin with an empty band.
    y: anywhere ? Math.random() * height : -r * 2,
    r,
    // Bigger flakes fall faster, which reads as depth.
    vy: 0.35 + r * 0.28 + Math.random() * 0.3,
    drift: 0.3 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.45 + Math.random() * 0.5,
  };
}

/** Falling snow over the page. Purely decorative: no pointer events, hidden from screen readers. */
export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      // Capped at 2x: a 3x phone screen would triple the pixels for no
      // visible gain on dots this small.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = flakeCount(width);
      if (flakes.length === 0) {
        flakes = Array.from({ length: target }, () => makeFlake(width, height, true));
      } else if (flakes.length > target) {
        flakes.length = target;
      } else {
        while (flakes.length < target) flakes.push(makeFlake(width, height, true));
      }
    };

    const draw = (now: number) => {
      // Scale movement by real elapsed time so the snow falls at the same
      // speed on 60Hz and 120Hz screens. Clamped so a long stall (tab
      // switch, slow frame) doesn't teleport every flake.
      const step = Math.min((now - last) / 16.67, 3);
      last = now;

      const light = document.documentElement.dataset.theme === "light";
      // White vanishes on the light theme, so flakes take the brand blush there.
      const rgb = light ? "214, 120, 160" : "255, 240, 246";

      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.y += f.vy * step;
        f.phase += 0.012 * step;
        const x = f.x + Math.sin(f.phase) * f.drift * 12;

        if (f.y - f.r > height) Object.assign(f, makeFlake(width, height, false));

        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${f.alpha})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    // Stop drawing while the tab is in the background; resume on return.
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-40"
    />
  );
}
