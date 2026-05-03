"use client";

import { useEffect, useRef, useState } from "react";
import { sampleImage, renderAsciiFrame, getGrid } from "./ascii-canvas";

const FADE_MS = 500;
const CYCLE_MS = 2000;

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
  // One <canvas> per src, all stacked with absolute positioning. Each
  // is baked once when its image loads, then we crossfade by toggling
  // CSS opacity — the compositor handles the fade on the GPU, so the
  // 500ms transition costs zero per-frame JS (vs the prior approach
  // which blended pixel arrays + ran fillText for ~8K cells per frame).
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sample = document.createElement("canvas");
    const baked = new Set<number>();
    let lastW = 0;
    let lastH = 0;

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
      const pixels = sampleImage(img, cols, rows, w, h, sample);
      if (!pixels) return;
      renderAsciiFrame(canvas.getContext("2d")!, pixels, cols, rows, w, h, dpr);
      baked.add(idx);
      lastW = w;
      lastH = h;
    }

    let cycleIdx = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext() {
      if (srcs.length < 2) return;
      timerId = setTimeout(() => {
        cycleIdx = (cycleIdx + 1) % srcs.length;
        if (!baked.has(cycleIdx)) bake(cycleIdx);
        onIndexChangeRef.current?.(cycleIdx);
        setCurrentIdx(cycleIdx);
        scheduleNext();
      }, CYCLE_MS);
    }

    let started = false;
    const onLoad = (idx: number) => {
      bake(idx);
      if (!started && baked.has(0)) {
        started = true;
        scheduleNext();
      }
    };
    images.forEach((img, i) => {
      if (img.complete && img.naturalWidth) onLoad(i);
      else img.onload = () => onLoad(i);
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        if (w === lastW && h === lastH) return;
        baked.clear();
        for (let i = 0; i < srcs.length; i++) bake(i);
      }, 150);
    });
    ro.observe(container);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
    };
  }, [srcs, cellSize, lowDpr]);

  return (
    <div ref={containerRef} className={className}>
      {srcs.map((src, i) => (
        <canvas
          key={src}
          ref={(el) => { canvasRefs.current[i] = el; }}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === currentIdx ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            willChange: "opacity",
          }}
        />
      ))}
    </div>
  );
}
