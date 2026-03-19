"use client";

import { useEffect, useRef } from "react";
import { loadGardenMathApi, type GardenMathApi } from "@/lib/wasm/garden-math";

const LAYERS = [
  { id: 0, opacity: 0.3, color: [230, 100, 140] },   // pink
  { id: 1, opacity: 0.4, color: [235, 150, 50] },    // orange
  { id: 2, opacity: 0.5, color: [250, 220, 60] },    // yellow
] as const;

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

interface CloudCanvasProps {
  invert?: boolean;
}

export function CloudCanvas({ invert = false }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let api: GardenMathApi | null = null;
    let raf: number;
    let visible = true;
    const startTime = performance.now();

    const SCALE = 4;

    const style = getComputedStyle(canvas);
    const [whiteR, whiteG, whiteB] = parseHex(
      style.getPropertyValue("--white").trim() || "#f5f4f0",
    );
    const [blackR, blackG, blackB] = parseHex(
      style.getPropertyValue("--black").trim() || "#1a1a14",
    );

    const [topR, topG, topB] = invert
      ? [blackR, blackG, blackB]
      : [whiteR, whiteG, whiteB];
    const [botR, botG, botB] = invert
      ? [whiteR, whiteG, whiteB]
      : [blackR, blackG, blackB];

    function resize() {
      if (!canvas) return;
      canvas.width = Math.ceil(canvas.offsetWidth / SCALE);
      canvas.height = Math.ceil(canvas.offsetHeight / SCALE);
    }

    resize();
    window.addEventListener("resize", resize);

    loadGardenMathApi().then((a) => {
      api = a;
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    function render(now: number) {
      raf = requestAnimationFrame(render);

      if (!visible || !canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const time = (now - startTime) / 1000;
      const cloudTime = invert ? -time : time;

      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      for (let y = 0; y < h; y++) {
        const fade = y / h;
        const easedFade = invert ? 1 - (1 - fade) * (1 - fade) : fade * fade;

        const baseR = topR + (botR - topR) * easedFade;
        const baseG = topG + (botG - topG) * easedFade;
        const baseB = topB + (botB - topB) * easedFade;

        const cloudWindow = Math.sin(fade * Math.PI);
        const ny = y / h;

        for (let x = 0; x < w; x++) {
          const nx = x / w;

          let r = baseR;
          let g = baseG;
          let b = baseB;

          if (api) {
            for (const layer of LAYERS) {
              const density = api.cloud_density(nx, ny, cloudTime, layer.id);
              const influence = density * cloudWindow * layer.opacity;

              r += (layer.color[0] - r) * influence;
              g += (layer.color[1] - g) * influence;
              b += (layer.color[2] - b) * influence;
            }
          }

          const i = (y * w + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [invert]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "auto" }}
    />
  );
}
