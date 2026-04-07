"use client";

import { useEffect, useRef, useCallback } from "react";
import emojiData from "@/data/messages/dianchik/emoji-data.json";

interface EmojiEntry { emoji: string; count: number }

const merged = new Map<string, number>();
for (const e of emojiData.sam as EmojiEntry[]) merged.set(e.emoji, (merged.get(e.emoji) ?? 0) + e.count);
for (const e of emojiData.dianchik as EmojiEntry[]) merged.set(e.emoji, (merged.get(e.emoji) ?? 0) + e.count);
const pool = [...merged.entries()].sort((a, b) => b[1] - a[1]);

const SCALE = 5;
const emojis: string[] = [];
for (const [emoji, count] of pool) {
  const n = Math.max(1, Math.round(count / SCALE));
  for (let i = 0; i < n; i++) emojis.push(emoji);
}

// Shuffle so same emojis aren't all clumped
for (let i = emojis.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
}

const FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const SIZE = 16;
const GAP = 2;

export function EmojiHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${SIZE}px ${FONT}`;

    const step = SIZE + GAP;
    const cols = Math.floor(w / step);

    for (let i = 0; i < emojis.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * step + step / 2;
      const y = row * step + step / 2;
      if (y > h + SIZE) break;
      ctx.globalAlpha = 0.15 + Math.random() * 0.15;
      ctx.fillText(emojis[i], x, y);
    }
  }, []);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div className="relative h-[50dvh] w-full overflow-hidden mb-3 md:mb-4">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="font-mono text-4xl md:text-6xl font-bold uppercase tracking-[0.3em] text-zinc-800/80">
          deana
        </h1>
      </div>
    </div>
  );
}
