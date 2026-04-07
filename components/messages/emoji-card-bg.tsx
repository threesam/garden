"use client";

import { useEffect, useRef } from "react";
import emojiData from "@/data/messages/dianchik/emoji-data.json";

interface EmojiEntry { emoji: string; count: number }

const merged = new Map<string, number>();
for (const e of emojiData.sam as EmojiEntry[]) merged.set(e.emoji, (merged.get(e.emoji) ?? 0) + e.count);
for (const e of emojiData.dianchik as EmojiEntry[]) merged.set(e.emoji, (merged.get(e.emoji) ?? 0) + e.count);
const pool = [...merged.entries()].sort((a, b) => b[1] - a[1]);

const emojis: string[] = [];
for (const [emoji, count] of pool) {
  const n = Math.max(1, Math.round(count / 40));
  for (let i = 0; i < n; i++) emojis.push(emoji);
}
for (let i = emojis.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
}

const FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const SIZE = 14;
const STEP = SIZE + 2;

export function EmojiCardBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    function draw() {
      const ctx = canvas!.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      if (w === 0 || h === 0) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${SIZE}px ${FONT}`;

      const cols = Math.ceil(w / STEP) + 1;
      const rows = Math.ceil(h / STEP) + 1;
      const total = cols * rows;
      for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
        ctx.fillText(emojis[i % emojis.length], col * STEP + STEP / 2, row * STEP + STEP / 2);
      }
    }

    // Draw after a frame to ensure layout is complete
    requestAnimationFrame(draw);

    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} />
    </div>
  );
}
