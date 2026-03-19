"use client";

import { useEffect, useRef } from "react";
import { loadGardenMathApi, type GardenMathApi } from "@/lib/wasm/garden-math";

const LAYERS = [
  { id: 0, opacity: 0.15 },
  { id: 1, opacity: 0.25 },
  { id: 2, opacity: 0.40 },
] as const;

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

interface CloudCanvasProps {
  /** false = white→black (anchor), true = black→white (hero) */
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
    const startTime = performance.now();

    const SCALE = 8;

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

    function render() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const time = (performance.now() - startTime) / 1000;

      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      const style = getComputedStyle(canvas);
      const [whiteR, whiteG, whiteB] = parseHex(
        style.getPropertyValue("--white").trim() || "#f5f4f0",
      );
      const [blackR, blackG, blackB] = parseHex(
        style.getPropertyValue("--black").trim() || "#1a1a14",
      );

      // Top and bottom colors depend on direction
      const [topR, topG, topB] = invert
        ? [blackR, blackG, blackB]
        : [whiteR, whiteG, whiteB];
      const [botR, botG, botB] = invert
        ? [whiteR, whiteG, whiteB]
        : [blackR, blackG, blackB];

      // Cloud color: always lighter (toward white)
      const [cloudR, cloudG, cloudB] = [whiteR, whiteG, whiteB];

      for (let y = 0; y < h; y++) {
        const fade = y / h;
        const easedFade = invert ? 1 - (1 - fade) * (1 - fade) : fade * fade;

        const baseR = topR + (botR - topR) * easedFade;
        const baseG = topG + (botG - topG) * easedFade;
        const baseB = topB + (botB - topB) * easedFade;

        const cloudWindow = Math.sin(fade * Math.PI);

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ny = y / h;

          let r = baseR;
          let g = baseG;
          let b = baseB;

          if (api) {
            for (const layer of LAYERS) {
              const density = api.cloud_density(nx, ny, time, layer.id);
              const influence = density * cloudWindow * layer.opacity;

              r += (cloudR - r) * influence;
              g += (cloudG - g) * influence;
              b += (cloudB - b) * influence;
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
      raf = requestAnimationFrame(render);
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [invert]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
