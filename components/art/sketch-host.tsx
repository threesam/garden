"use client";

import { useEffect, useRef } from "react";
import type { SketchAPI } from "@/lib/art/types";
import { mulberry32 } from "@/lib/art/rng";
import { makeNoise } from "@/lib/art/noise";
import { getSketch } from "@/lib/art/registry";

interface Props {
  slug: string;
  seed?: number;
  /**
   * When true, the sketch is set up and ticks. When false, it tears down —
   * cancels its rAF, runs the sketch's cleanup fn, and clears the canvas
   * pixel buffer so memory is released. Driven by the parent gallery's
   * scroll-window coordinator; not per-element IntersectionObserver.
   */
  active: boolean;
}

export function SketchHost({ slug, seed, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

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
      hasSetup = true;
    }

    function teardownSketch() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (cleanup) cleanup();
      cleanup = null;
      tick = null;
      api = null;
      // Release the canvas pixel buffer — setting width/height to 0 tells the
      // browser to drop the GPU-backed ImageBitmap.
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      hasSetup = false;
    }

    function tickFrame() {
      rafId = 0;
      if (!activeRef.current || !api || !tick) return;
      tick(api, frame++);
      rafId = requestAnimationFrame(tickFrame);
    }

    function startTick() {
      if (rafId || !tick) return;
      rafId = requestAnimationFrame(tickFrame);
    }

    // Activate / deactivate in response to the `active` prop.
    const stateSync = () => {
      if (active) {
        if (!hasSetup) setupSketch();
        startTick();
      } else if (hasSetup) {
        teardownSketch();
      }
    };

    stateSync();

    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!hasSetup) return;
        teardownSketch();
        setupSketch();
        if (activeRef.current) startTick();
      }, 150);
    });
    ro.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      ro.disconnect();
      if (hasSetup) teardownSketch();
    };
  }, [slug, seed, active]);

  return (
    <div ref={containerRef} className="relative h-full w-full" style={{ backgroundColor: "var(--black)" }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
