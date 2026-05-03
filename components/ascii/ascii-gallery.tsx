"use client";

import { useEffect, useRef } from "react";
import { sampleImage, renderAsciiFrame, getGrid } from "./ascii-canvas";

const FADE_MS = 500;
const CYCLE_MS = 2000;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface AsciiGalleryProps {
  srcs: string[];
  className?: string;
  cellSize?: number;
  onIndexChange?: (index: number) => void;
  /** Render at 1× CSS pixels instead of devicePixelRatio. */
  lowDpr?: boolean;
}

export function AsciiGallery({ srcs, className = "", cellSize = 3, onIndexChange, lowDpr = false }: AsciiGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const images: HTMLImageElement[] = srcs.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const sample = document.createElement("canvas");
    const pixelCache = new Map<string, Uint8ClampedArray>();
    let currentIdx = 0;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastW = 0;
    let lastH = 0;

    function cachedSample(img: HTMLImageElement, cols: number, rows: number, w: number, h: number) {
      const key = `${img.src}:${cols}x${rows}`;
      const cached = pixelCache.get(key);
      if (cached) return cached;
      const data = sampleImage(img, cols, rows, w, h, sample);
      if (data) pixelCache.set(key, data);
      return data;
    }

    function setupCanvas(w: number, h: number) {
      const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      lastW = w;
      lastH = h;
      pixelCache.clear();
    }

    function renderStatic() {
      if (!canvas || !container) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;
      if (w !== lastW || h !== lastH) setupCanvas(w, h);

      const { cols, rows } = getGrid(w, h, cellSize);
      const pixels = cachedSample(images[currentIdx], cols, rows, w, h);
      if (!pixels) return;
      const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);
      renderAsciiFrame(canvas.getContext("2d")!, pixels, cols, rows, w, h, dpr);
    }

    function startTransition() {
      if (srcs.length < 2) return;

      const nextIdx = (currentIdx + 1) % srcs.length;
      onIndexChangeRef.current?.(nextIdx);
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      if (w === 0 || h === 0) return;
      if (w !== lastW || h !== lastH) setupCanvas(w, h);

      const { cols, rows } = getGrid(w, h, cellSize);
      const curData = cachedSample(images[currentIdx], cols, rows, w, h);
      const nxt = cachedSample(images[nextIdx], cols, rows, w, h);
      if (!curData) return;
      const cur = curData;

      const startTime = performance.now();
      const blended = new Uint8ClampedArray(cur.length);
      const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);

      function fadeStep(now: number) {
        const t = clamp((now - startTime) / FADE_MS, 0, 1);
        const smooth = t * t * (3 - 2 * t);

        if (nxt) {
          for (let i = 0; i < cur.length; i++) {
            blended[i] = Math.floor(cur[i] * (1 - smooth) + nxt[i] * smooth);
          }
          renderAsciiFrame(canvas!.getContext("2d")!, blended, cols, rows, w, h, dpr);
        } else {
          renderAsciiFrame(canvas!.getContext("2d")!, cur, cols, rows, w, h, dpr);
        }

        if (t < 1) {
          rafId = requestAnimationFrame(fadeStep);
        } else {
          currentIdx = nextIdx;
          scheduleNext();
        }
      }

      rafId = requestAnimationFrame(fadeStep);
    }

    function scheduleNext() {
      if (srcs.length < 2) return;
      timerId = setTimeout(startTransition, Math.max(0, CYCLE_MS - FADE_MS));
    }

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 1) {
        renderStatic();
        scheduleNext();
      }
    };
    for (const img of images) {
      if (img.complete && img.naturalWidth) onLoad();
      else img.onload = onLoad;
    }

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(renderStatic, 150);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
    };
  }, [srcs, cellSize]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
