"use client";

import { useEffect, useRef } from "react";
import { loadGardenMathApi, type GardenMathApi } from "@/lib/wasm/garden-math";

// Layer config: background (0) → middleground (1) → foreground (2)
// Rendered back-to-front. Each layer's opacity determines how much it
// lightens the gradient underneath — foreground is strongest.
const LAYERS = [
  { id: 0, opacity: 0.15 }, // background: faintest, slowest (speed in WASM)
  { id: 1, opacity: 0.25 }, // middleground
  { id: 2, opacity: 0.40 }, // foreground: strongest, fastest
] as const;

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function Anchor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let api: GardenMathApi | null = null;
    let raf: number;
    const startTime = performance.now();

    // Chunky pixels
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
      const [bgR, bgG, bgB] = parseHex(
        style.getPropertyValue("--white").trim() || "#f5f4f0",
      );
      const [endR, endG, endB] = parseHex(
        style.getPropertyValue("--black").trim() || "#1a1a14",
      );

      for (let y = 0; y < h; y++) {
        const fade = y / h;
        const easedFade = fade * fade;

        // Base gradient color at this row
        const baseR = bgR + (endR - bgR) * easedFade;
        const baseG = bgG + (endG - bgG) * easedFade;
        const baseB = bgB + (endB - bgB) * easedFade;

        // Clouds are most visible in the middle of the fade
        const cloudWindow = Math.sin(fade * Math.PI);

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ny = y / h;

          // Start with the gradient
          let r = baseR;
          let g = baseG;
          let b = baseB;

          // Composite each layer back-to-front
          if (api) {
            for (const layer of LAYERS) {
              const density = api.cloud_density(nx, ny, time, layer.id);
              const influence = density * cloudWindow * layer.opacity;

              // Lighten toward white
              r += (bgR - r) * influence;
              g += (bgG - g) * influence;
              b += (bgB - b) * influence;
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
  }, []);

  return (
    <div className="relative h-screen w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
