"use client";

import { useEffect, useRef } from "react";

const ASCII_RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lumToTone(lum: number): number {
  const stretched = clamp((lum - 0.1) / 0.65, 0, 1);
  const s2 = stretched * stretched * (3 - 2 * stretched);
  return 1 - s2 * s2 * (3 - 2 * s2);
}

export interface AsciiRenderOptions {
  cellSize?: number;
  heightRatio?: number;
}

/** Sample an image to a pixel grid using cover-fit */
export function sampleImage(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  w: number,
  h: number,
  sampleCanvas: HTMLCanvasElement,
): Uint8ClampedArray | null {
  if (!img.complete || !img.naturalWidth) return null;

  sampleCanvas.width = cols;
  sampleCanvas.height = rows;
  const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true })!;

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
  return sCtx.getImageData(0, 0, cols, rows).data;
}

/** Render pixel data as ASCII characters onto a canvas */
export function renderAsciiFrame(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8ClampedArray,
  cols: number,
  rows: number,
  w: number,
  h: number,
  dpr: number,
) {
  const cellW = w / cols;
  const cellH = h / rows;

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

/** Compute grid dimensions from container size */
export function getGrid(w: number, h: number, cellSize = 3, heightRatio = 1.8) {
  const cols = Math.floor(w / cellSize);
  const rows = Math.floor(h / (cellSize * heightRatio));
  return { cols, rows };
}

interface AsciiCanvasProps {
  src: string;
  className?: string;
  cellSize?: number;
}

export function AsciiCanvas({ src, className = "", cellSize = 3 }: AsciiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const img = new Image();
    img.src = src;
    const sample = document.createElement("canvas");

    function paint() {
      if (!canvas || !container || !img.complete || !img.naturalWidth) return;

      const dpr = window.devicePixelRatio || 1;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const { cols, rows } = getGrid(w, h, cellSize);
      const pixels = sampleImage(img, cols, rows, w, h, sample);
      if (!pixels) return;

      const ctx = canvas.getContext("2d")!;
      renderAsciiFrame(ctx, pixels, cols, rows, w, h, dpr);
    }

    img.onload = paint;
    if (img.complete) paint();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(paint, 150);
    });
    ro.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      ro.disconnect();
    };
  }, [src, cellSize]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
