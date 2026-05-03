"use client";

import { useEffect, useRef } from "react";
import { sampleImage, renderAsciiFrame, getGrid } from "./ascii-canvas";

const CYCLE_MS = 2000;

// Module-level scratch canvas reused across all gallery instances. sampleImage
// uses it synchronously inside bake() and never holds onto a reference, so
// every AsciiGallery instance on a page can share one allocation.
let sharedSample: HTMLCanvasElement | null = null;
function getSampleCanvas() {
  return sharedSample ??= document.createElement("canvas");
}

interface AsciiGalleryProps {
  srcs: string[];
  className?: string;
  cellSize?: number;
  onIndexChange?: (index: number) => void;
  /** Render at 1× CSS pixels instead of devicePixelRatio. */
  lowDpr?: boolean;
}

// Stack one canvas per src and crossfade with CSS opacity (transition lives
// in .ascii-gallery-layer). The compositor handles the fade on the GPU,
// avoiding the per-frame pixel-blend + 8K fillText calls of the prior impl.
export function AsciiGallery({ srcs, className = "", cellSize = 3, onIndexChange, lowDpr = false }: AsciiGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const baked = new Set<number>();
    let lastW = 0;
    let lastH = 0;
    let activeIdx = 0;

    const images = srcs.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    function bake(idx: number) {
      const canvas = canvasRefs.current[idx];
      const img = images[idx];
      if (!canvas || !container || !img.complete || !img.naturalWidth) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;
      const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const { cols, rows } = getGrid(w, h, cellSize);
      const pixels = sampleImage(img, cols, rows, w, h, getSampleCanvas());
      if (!pixels) return;
      renderAsciiFrame(canvas.getContext("2d")!, pixels, cols, rows, w, h, dpr);
      baked.add(idx);
      lastW = w;
      lastH = h;
    }

    function show(idx: number) {
      const prev = canvasRefs.current[activeIdx];
      const next = canvasRefs.current[idx];
      if (prev) prev.style.opacity = "0";
      if (next) next.style.opacity = "1";
      activeIdx = idx;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;
    function scheduleNext() {
      if (srcs.length < 2) return;
      timerId = setTimeout(() => {
        const nextIdx = (activeIdx + 1) % srcs.length;
        if (!baked.has(nextIdx)) bake(nextIdx);
        // Skip the rotation if the next image still hasn't loaded — its
        // onload handler will bake it, and the cycle after will pick it
        // up. Better than fading the visible canvas to a blank one.
        if (!baked.has(nextIdx)) {
          scheduleNext();
          return;
        }
        onIndexChangeRef.current?.(nextIdx);
        show(nextIdx);
        scheduleNext();
      }, CYCLE_MS);
    }

    // Bake idx 0 eagerly so first paint is correct. Other indices bake on
    // their image's load event — naturally async, so each sits in its own
    // task. Cached images (which would otherwise burst all 6 bakes into one
    // synchronous task) get deferred to the next macrotask.
    const removeListeners: Array<() => void> = [];
    let started = false;
    function startIfReady() {
      if (started || !images[0].complete || !images[0].naturalWidth) return;
      started = true;
      bake(0);
      show(0);
      scheduleNext();
    }
    startIfReady();
    if (!started) {
      images[0].addEventListener("load", startIfReady);
      removeListeners.push(() => images[0].removeEventListener("load", startIfReady));
    }

    const deferredBakes: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < images.length; i++) {
      const idx = i;
      const onLoad = () => { if (!baked.has(idx)) bake(idx); };
      if (images[idx].complete && images[idx].naturalWidth) {
        deferredBakes.push(setTimeout(onLoad, 0));
      } else {
        images[idx].addEventListener("load", onLoad);
        removeListeners.push(() => images[idx].removeEventListener("load", onLoad));
      }
    }

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        if (w === lastW && h === lastH) return;
        // Only re-bake images that were already baked. New rotations re-bake
        // on demand via scheduleNext. Skips work for srcs that may never be
        // shown if the gallery unmounts before cycling around.
        const previouslyBaked = Array.from(baked);
        baked.clear();
        for (const i of previouslyBaked) bake(i);
      }, 150);
    });
    ro.observe(container);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearTimeout(resizeTimeout);
      for (const t of deferredBakes) clearTimeout(t);
      for (const r of removeListeners) r();
      ro.disconnect();
    };
  }, [srcs, cellSize, lowDpr]);

  return (
    <div ref={containerRef} className={className}>
      {srcs.map((src, i) => (
        <canvas
          key={src}
          ref={(el) => { canvasRefs.current[i] = el; }}
          className="ascii-gallery-layer"
        />
      ))}
    </div>
  );
}
