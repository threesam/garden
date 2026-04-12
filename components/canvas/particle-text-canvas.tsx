"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 500;
const SPEED = 0.6;
const DAMPING = 0.85;
const TITLE = "ANYTHING BUT ANALOG";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  points: number; // vertices for asteroid shape
  angles: number[]; // irregular vertex offsets
  rot: number; // current rotation
  rotSpeed: number;
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
    const particles: Particle[] = [];
    let rafId = 0;

    const offscreen = document.createElement("canvas");

    function buildCollisionMap() {
      w = container!.offsetWidth;
      h = container!.offsetHeight;
      if (w === 0 || h === 0) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;

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
    }

    function isColliding(px: number, py: number): boolean {
      if (!collisionMap) return false;
      const mx = Math.round(px);
      const my = Math.round(py);
      if (mx < 0 || mx >= mapW || my < 0 || my >= mapH) return false;
      return collisionMap[my * mapW + mx] === 1;
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const pts = 5 + Math.floor(Math.random() * 4);
        const angles: number[] = [];
        for (let j = 0; j < pts; j++) {
          angles.push(0.5 + Math.random() * 0.5); // radius variation per vertex
        }
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * SPEED * (0.5 + Math.random()),
          vy: Math.sin(angle) * SPEED * (0.5 + Math.random()),
          r: 1 + Math.random() * 3.5,
          points: pts,
          angles,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }

    function tick() {
      if (!canvas || !collisionMap) { rafId = requestAnimationFrame(tick); return; }

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Draw text in gold — stacked
      const drawLines = ["ANYTHING", "BUT", "ANALOG"];
      const drawFontSize = Math.floor(h * 0.22);
      const drawLineHeight = drawFontSize * 1.15;
      ctx.font = `bold ${drawFontSize}px Jost, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "var(--white)";
      ctx.letterSpacing = "0.1em";
      const drawTotalH = drawLines.length * drawLineHeight;
      const drawStartY = (h - drawTotalH) / 2 + drawLineHeight / 2;
      for (let i = 0; i < drawLines.length; i++) {
        ctx.fillText(drawLines[i], w / 2, drawStartY + i * drawLineHeight);
      }

      // Update and draw particles
      for (const p of particles) {
        const nx = p.x + p.vx;
        const ny = p.y + p.vy;

        const hitX = isColliding(nx, p.y);
        const hitY = isColliding(p.x, ny);
        const hitBoth = isColliding(nx, ny);

        if (hitY || (hitBoth && !hitX)) {
          p.vy = -p.vy * DAMPING;
          p.vx += (Math.random() - 0.5) * 0.2;
        } else {
          p.y = ny;
        }

        if (hitX || (hitBoth && !hitY)) {
          p.vx = -p.vx * DAMPING;
          p.vy += (Math.random() - 0.5) * 0.2;
        } else {
          p.x = nx;
        }

        // Unstick
        if (isColliding(p.x, p.y)) {
          p.x += p.vx > 0 ? 2 : -2;
          p.y += p.vy > 0 ? 2 : -2;
        }

        // Maintain speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < SPEED * 0.3) {
          const angle = Math.atan2(p.vy, p.vx);
          p.vx = Math.cos(angle) * SPEED * 0.5;
          p.vy = Math.sin(angle) * SPEED * 0.5;
        }

        // Bounce off edges
        if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
        if (p.x > w - p.r) { p.x = w - p.r; p.vx = -Math.abs(p.vx); }
        if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
        if (p.y > h - p.r) { p.y = h - p.r; p.vy = -Math.abs(p.vy); }

        // Draw asteroid
        p.rot += p.rotSpeed;
        const bright = 0.4 + (p.r / 4.5) * 0.4;
        ctx.fillStyle = `rgba(212, 175, 55, ${bright})`;
        ctx.beginPath();
        for (let i = 0; i < p.points; i++) {
          const a = p.rot + (i / p.points) * Math.PI * 2;
          const rad = p.r * p.angles[i];
          const px = p.x + Math.cos(a) * rad;
          const py = p.y + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

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
