"use client";

import { useEffect, useRef, useState } from "react";
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
// Shuffle once
for (let i = emojis.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
}

const FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const SIZE = 16;
const GAP = 2;
const STEP = SIZE + GAP;
const CHARS = ["I", "_", "E", "-"];

// Pre-generate stable opacities
const opacities = emojis.map(() => 0.15 + Math.random() * 0.15);

export function EmojiHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<HTMLCanvasElement | null>(null);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCharIdx((i) => (i + 1) % CHARS.length), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastW = 0;
    let lastH = 0;

    function buildCache(w: number, h: number) {
      const dpr = window.devicePixelRatio || 1;
      const offscreen = document.createElement("canvas");
      offscreen.width = w * dpr;
      offscreen.height = h * dpr;
      const ctx = offscreen.getContext("2d")!;
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
        ctx.globalAlpha = opacities[i % opacities.length];
        ctx.fillText(emojis[i % emojis.length], col * STEP + STEP / 2, row * STEP + STEP / 2);
      }
      cacheRef.current = offscreen;
    }

    function paint() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.parentElement!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        canvas!.width = w * dpr;
        canvas!.height = h * dpr;
        canvas!.style.width = `${w}px`;
        canvas!.style.height = `${h}px`;
        buildCache(w, h);
      }

      const ctx = canvas!.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      if (cacheRef.current) {
        ctx.drawImage(cacheRef.current, 0, 0);
      }
    }

    paint();

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(paint, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative h-[50dvh] w-full overflow-hidden mb-3 md:mb-4">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-zinc-800/80">
          D<span className="inline-block w-8 md:w-12 text-center">{CHARS[charIdx]}</span>ANA
        </h1>
      </div>
    </div>
  );
}
