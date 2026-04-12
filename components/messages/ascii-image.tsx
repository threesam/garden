"use client";

import { useEffect, useRef } from "react";

const ASCII_RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const FADE_MS = 800;
const CYCLE_MS = 3000;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lumToTone(lum: number): number {
  const stretched = clamp((lum - 0.1) / 0.65, 0, 1);
  const s2 = stretched * stretched * (3 - 2 * stretched);
  return 1 - s2 * s2 * (3 - 2 * s2);
}

interface AsciiImageProps {
  srcs: string[];
  className?: string;
}

export function AsciiImage({ srcs, className = "" }: AsciiImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let currentIdx = 0;
    let nextIdx = 1 % srcs.length;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastW = 0;
    let lastH = 0;

    const pixelCache = new Map<string, Uint8ClampedArray>();

    function sampleImg(img: HTMLImageElement, cols: number, rows: number, w: number, h: number): Uint8ClampedArray | null {
      if (!img.complete || !img.naturalWidth) return null;

      const key = `${img.src}:${cols}x${rows}`;
      const cached = pixelCache.get(key);
      if (cached) return cached;

      sample.width = cols;
      sample.height = rows;
      const sCtx = sample.getContext("2d", { willReadFrequently: true })!;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgAspect > containerAspect) {
        sw = img.naturalHeight * containerAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / containerAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      const data = sCtx.getImageData(0, 0, cols, rows).data;
      pixelCache.set(key, data);
      return data;
    }

    function renderFrame(pixels: Uint8ClampedArray, cols: number, rows: number, w: number, h: number) {
      const dpr = window.devicePixelRatio || 1;
      const cellW = w / cols;
      const cellH = h / rows;

      const ctx = canvas!.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const fontSize = Math.max(4, Math.floor(cellH * 0.9));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const off = (y * cols + x) * 4;
          const r = pixels[off];
          const g = pixels[off + 1];
          const b = pixels[off + 2];

          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const tone = lumToTone(lum);
          const idx = Math.floor(tone * (ASCII_RAMP.length - 1));
          const glyph = ASCII_RAMP[idx] ?? " ";
          if (glyph === " ") continue;

          const alpha = 0.2 + tone * 0.75;
          ctx.fillStyle = `rgba(20, 20, 20, ${alpha})`;
          ctx.fillText(glyph, x * cellW, y * cellH);
        }
      }
    }

    function getLayout() {
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      const cellSize = 3;
      const cols = Math.floor(w / cellSize);
      const rows = Math.floor(h / (cellSize * 1.8));
      return { w, h, cols, rows };
    }

    function setupCanvas(w: number, h: number) {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      lastW = w;
      lastH = h;
      pixelCache.clear();
    }

    // Render a static frame (no blend)
    function renderStatic() {
      if (!canvas || !container) return;
      const { w, h, cols, rows } = getLayout();
      if (w === 0 || h === 0) return;
      if (w !== lastW || h !== lastH) setupCanvas(w, h);

      const pixels = sampleImg(images[currentIdx], cols, rows, w, h);
      if (!pixels) return;
      renderFrame(pixels, cols, rows, w, h);
    }

    // Animate the crossfade transition
    function startTransition() {
      if (srcs.length < 2) return;

      nextIdx = (currentIdx + 1) % srcs.length;
      const { w, h, cols, rows } = getLayout();
      if (w === 0 || h === 0) return;
      if (w !== lastW || h !== lastH) setupCanvas(w, h);

      const curPixels = sampleImg(images[currentIdx], cols, rows, w, h);
      const nxtPixels = sampleImg(images[nextIdx], cols, rows, w, h);
      if (!curPixels) return;

      const startTime = performance.now();
      const blended = new Uint8ClampedArray(curPixels.length);

      function fadeStep(now: number) {
        const t = clamp((now - startTime) / FADE_MS, 0, 1);
        const smooth = t * t * (3 - 2 * t);

        if (nxtPixels) {
          for (let i = 0; i < curPixels.length; i++) {
            blended[i] = Math.floor(curPixels[i] * (1 - smooth) + nxtPixels[i] * smooth);
          }
          renderFrame(blended, cols, rows, w, h);
        } else {
          renderFrame(curPixels, cols, rows, w, h);
        }

        if (t < 1) {
          rafId = requestAnimationFrame(fadeStep);
        } else {
          // Transition done — advance and schedule next
          currentIdx = nextIdx;
          scheduleNext();
        }
      }

      rafId = requestAnimationFrame(fadeStep);
    }

    function scheduleNext() {
      if (srcs.length < 2) return;
      timerId = setTimeout(startTransition, CYCLE_MS);
    }

    // Initial render once first image loads, then start cycle
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

    // Handle resize
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(renderStatic, 150);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
    };
  }, [srcs]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
