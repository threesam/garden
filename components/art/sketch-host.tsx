"use client";

import { useEffect, useRef } from "react";
import type { SketchAPI } from "@/lib/art/types";
import { mulberry32 } from "@/lib/art/rng";
import { makeNoise } from "@/lib/art/noise";
import { getSketch } from "@/lib/art/registry";

interface Props {
  slug: string;
  seed?: number;
}

/**
 * Generic host for a generative-art sketch. Handles:
 *  - Canvas sizing + device-pixel-ratio
 *  - Seeded rng + noise helpers
 *  - ResizeObserver (debounced) — reruns setup
 *  - IntersectionObserver — pauses rAF while off-screen
 *  - rAF tick loop when sketch returns a tick fn
 *  - Cleanup contract for WebGL/three sketches (sketch.manualCanvas)
 */
export function SketchHost({ slug, seed }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const maybeSketch = getSketch(slug);
    if (!maybeSketch) return;
    const sketch = maybeSketch;

    const actualSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    const rng = mulberry32(actualSeed);
    const noise = makeNoise(actualSeed);

    let rafId = 0;
    let isVisible = false;
    let resizeTimeout: ReturnType<typeof setTimeout>;
    let cleanup: (() => void) | null = null;
    let tick: ((api: SketchAPI, frame: number) => void) | null = null;
    let frame = 0;
    let api: SketchAPI | null = null;
    let hasSetup = false;

    function setupSketch() {
      const dpr = window.devicePixelRatio || 1;
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      if (w === 0 || h === 0) return;

      if (!sketch.manualCanvas) {
        canvas!.width = w * dpr;
        canvas!.height = h * dpr;
        canvas!.style.width = `${w}px`;
        canvas!.style.height = `${h}px`;
        const ctx = canvas!.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        api = {
          ctx,
          w,
          h,
          dpr,
          rng,
          noise,
          lerp: (a, b, t) => a + (b - a) * t,
          map: (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1),
          dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
        };
      } else {
        // WebGL/Three sketches own their canvas sizing; give them a stub api
        api = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ctx: null as any,
          w,
          h,
          dpr,
          rng,
          noise,
          lerp: (a, b, t) => a + (b - a) * t,
          map: (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1),
          dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
        };
      }

      const result = sketch.setup(api, canvas!);
      if (result) {
        tick = result.tick ?? null;
        cleanup = result.cleanup ?? null;
      }
      frame = 0;
    }

    function teardownSketch() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (cleanup) cleanup();
      cleanup = null;
      tick = null;
    }

    function tickFrame() {
      rafId = 0;
      if (!isVisible || !api || !tick) return;
      tick(api, frame++);
      rafId = requestAnimationFrame(tickFrame);
    }

    function startTick() {
      if (rafId || !tick) return;
      rafId = requestAnimationFrame(tickFrame);
    }

    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!hasSetup) return; // no-op until first visibility triggered setup
        teardownSketch();
        setupSketch();
        if (isVisible) startTick();
      }, 150);
    });
    ro.observe(container);

    // Defer setup until first visibility — a stacked grid of 12 canvases
    // would otherwise run 12 setups synchronously on mount.
    const io = new IntersectionObserver(
      (entries) => {
        const wasVisible = isVisible;
        isVisible = entries[0]?.isIntersecting ?? false;
        if (isVisible) {
          if (!hasSetup) {
            setupSketch();
            hasSetup = true;
          }
          if (!wasVisible) startTick();
        }
      },
      { threshold: 0, rootMargin: "200px" } // warm up slightly before visible
    );
    io.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      ro.disconnect();
      io.disconnect();
      teardownSketch();
    };
  }, [slug, seed]);

  return (
    <div ref={containerRef} className="relative h-full w-full" style={{ backgroundColor: "var(--black)" }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
