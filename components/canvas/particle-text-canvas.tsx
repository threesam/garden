"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 1000;
const SPEED = 0.6;
const SPEED_MIN_SQ = (SPEED * 0.3) * (SPEED * 0.3);
const SPEED_RESTORE = SPEED * 0.5;
const DAMPING = 0.85;

// Precompute unit circle sample points for collision
const SAMPLE_STEPS = 8;
const COS_TABLE = new Float32Array(SAMPLE_STEPS);
const SIN_TABLE = new Float32Array(SAMPLE_STEPS);
for (let i = 0; i < SAMPLE_STEPS; i++) {
  const a = (i / SAMPLE_STEPS) * Math.PI * 2;
  COS_TABLE[i] = Math.cos(a);
  SIN_TABLE[i] = Math.sin(a);
}

export function ParticleTextCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    let collisionMap: Uint8Array | null = null;
    let mapW = 0;
    let mapH = 0;
    let rafId = 0;
    let textBitmap: HTMLCanvasElement | null = null;

    // Flat arrays for particle data — avoids object allocation overhead
    let px: Float32Array;
    let py: Float32Array;
    let pvx: Float32Array;
    let pvy: Float32Array;
    let pr: Float32Array;
    let count = 0;

    const offscreen = document.createElement("canvas");

    // Cache --white color
    let textColor = "#f5f0e8";

    function buildCollisionMap() {
      w = container!.offsetWidth;
      h = container!.offsetHeight;
      if (w === 0 || h === 0) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;

      textColor = getComputedStyle(container!).getPropertyValue("--white").trim() || "#f5f0e8";

      mapW = w;
      mapH = h;
      offscreen.width = mapW;
      offscreen.height = mapH;
      const oCtx = offscreen.getContext("2d")!;
      oCtx.clearRect(0, 0, mapW, mapH);

      const lines = ["ANYTHING", "BUT", "ANALOG"];
      const fontSize = Math.floor(mapH * 0.22);
      const lineHeight = fontSize * 1.15;
      oCtx.font = `bold ${fontSize}px Jost, sans-serif`;
      oCtx.textAlign = "center";
      oCtx.textBaseline = "middle";
      oCtx.fillStyle = "white";
      oCtx.letterSpacing = "0.1em";
      const totalH = lines.length * lineHeight;
      const startY = (mapH - totalH) / 2 + lineHeight / 2;
      for (let i = 0; i < lines.length; i++) {
        oCtx.fillText(lines[i], mapW / 2, startY + i * lineHeight);
      }

      const imageData = oCtx.getImageData(0, 0, mapW, mapH).data;
      collisionMap = new Uint8Array(mapW * mapH);
      for (let i = 0; i < collisionMap.length; i++) {
        collisionMap[i] = imageData[i * 4 + 3] > 128 ? 1 : 0;
      }

      // Pre-render text to a bitmap so we blit instead of fillText each frame
      textBitmap = document.createElement("canvas");
      textBitmap.width = w * dpr;
      textBitmap.height = h * dpr;
      const tCtx = textBitmap.getContext("2d")!;
      tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tCtx.font = `bold ${fontSize}px Jost, sans-serif`;
      tCtx.textAlign = "center";
      tCtx.textBaseline = "middle";
      tCtx.fillStyle = textColor;
      tCtx.letterSpacing = "0.1em";
      for (let i = 0; i < lines.length; i++) {
        tCtx.fillText(lines[i], w / 2, startY + i * lineHeight);
      }
    }

    function initParticles() {
      count = PARTICLE_COUNT;
      px = new Float32Array(count);
      py = new Float32Array(count);
      pvx = new Float32Array(count);
      pvy = new Float32Array(count);
      pr = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = SPEED * (0.5 + Math.random());
        px[i] = Math.random() * w;
        py[i] = Math.random() * h;
        pvx[i] = Math.cos(angle) * spd;
        pvy[i] = Math.sin(angle) * spd;
        pr[i] = 0.8 + Math.random() * 2.5;
      }
    }

    function tick() {
      if (!canvas || !collisionMap || !textBitmap) { rafId = requestAnimationFrame(tick); return; }

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Blit cached text
      ctx.drawImage(textBitmap, 0, 0);

      // Update and draw particles
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = 0; i < count; i++) {
        const r = pr[i];
        let x = px[i] + pvx[i];
        let y = py[i] + pvy[i];
        let vx = pvx[i];
        let vy = pvy[i];

        // Circle collision — sample edge points
        let normX = 0;
        let normY = 0;
        let hitCount = 0;
        for (let s = 0; s < SAMPLE_STEPS; s++) {
          const sx = (x + COS_TABLE[s] * r) | 0;
          const sy = (y + SIN_TABLE[s] * r) | 0;
          if (sx >= 0 && sx < mapW && sy >= 0 && sy < mapH && collisionMap[sy * mapW + sx] === 1) {
            hitCount++;
            normX -= COS_TABLE[s];
            normY -= SIN_TABLE[s];
          }
        }

        if (hitCount > 0) {
          const len = Math.sqrt(normX * normX + normY * normY) || 1;
          normX /= len;
          normY /= len;
          const dot = vx * normX + vy * normY;
          vx = (vx - 2 * dot * normX) * DAMPING;
          vy = (vy - 2 * dot * normY) * DAMPING;
          x += normX * 2;
          y += normY * 2;
        }

        // Maintain minimum speed (compare squared to avoid sqrt)
        const speedSq = vx * vx + vy * vy;
        if (speedSq < SPEED_MIN_SQ) {
          const angle = Math.atan2(vy, vx);
          vx = Math.cos(angle) * SPEED_RESTORE;
          vy = Math.sin(angle) * SPEED_RESTORE;
        }

        // Bounce off edges
        if (x < r) { x = r; vx = vx < 0 ? -vx : vx; }
        else if (x > w - r) { x = w - r; vx = vx > 0 ? -vx : vx; }
        if (y < r) { y = r; vy = vy < 0 ? -vy : vy; }
        else if (y > h - r) { y = h - r; vy = vy > 0 ? -vy : vy; }

        px[i] = x;
        py[i] = y;
        pvx[i] = vx;
        pvy[i] = vy;

        // Draw — batch by similar alpha
        const bright = 0.4 + (r / 3.3) * 0.4;
        ctx.globalAlpha = bright;
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }

    buildCollisionMap();
    initParticles();
    rafId = requestAnimationFrame(tick);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        buildCollisionMap();
        initParticles();
      }, 150);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative my-12 -mx-6 md:mx-0 md:w-[768px] md:max-w-[768px] md:left-1/2 md:-translate-x-1/2 overflow-hidden md:rounded-lg"
      style={{ height: 200, backgroundColor: "black" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
