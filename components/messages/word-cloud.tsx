"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import cloud from "d3-cloud";
import wordsData from "@/data/messages/dianchik/words-data.json";

interface WordEntry {
  word: string;
  count: number;
}

type Who = "both" | "sam" | "dianchik";

const sam = wordsData.sam_cloud as WordEntry[];
const dia = wordsData.dia_cloud as WordEntry[];

const merged = new Map<string, number>();
for (const e of sam) merged.set(e.word, (merged.get(e.word) ?? 0) + e.count);
for (const e of dia) merged.set(e.word, (merged.get(e.word) ?? 0) + e.count);
const both = [...merged.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 150)
  .map(([word, count]) => ({ word, count }));

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  count: number;
}

export function WordCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [who, setWho] = useState<Who>("both");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = 400;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const words = who === "sam" ? sam : who === "dianchik" ? dia : both;
    const max = words[0]?.count ?? 1;

    const baseColor = who === "sam"
      ? [30, 30, 30]
      : who === "dianchik"
        ? [180, 140, 20]
        : [60, 60, 60];

    const layout = cloud()
      .size([width * 2, height * 2])
      .words(
        words.slice(0, 120).map((w) => ({
          text: w.word,
          size: 14 + (w.count / max) * 56,
          count: w.count,
        }))
      )
      .padding(4)
      .rotate(() => (Math.random() > 0.7 ? 90 : 0))
      .font("monospace")
      .fontSize((d) => (d as { size: number }).size)
      .on("end", (layoutWords: LayoutWord[]) => {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const w of layoutWords) {
          const opacity = 0.2 + ((w.count ?? 0) / max) * 0.8;
          ctx.save();
          ctx.translate(canvas.width / 2 + w.x, canvas.height / 2 + w.y);
          ctx.rotate((w.rotate * Math.PI) / 180);
          ctx.font = `${w.size}px monospace`;
          ctx.fillStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${opacity})`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(w.text ?? "", 0, 0);
          ctx.restore();
        }
      });

    layout.start();
  }, [who]);

  useEffect(() => {
    draw();
    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(draw, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, [draw]);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          word cloud
        </span>
        <div className="flex gap-3">
          {(["both", "sam", "dianchik"] as Who[]).map((w) => (
            <button
              key={w}
              onClick={() => setWho(w)}
              className={`font-mono text-[10px] tracking-wider transition-colors ${
                who === w ? "text-black" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
