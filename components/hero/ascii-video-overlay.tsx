"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ASCII_RAMP = " .,:-~+*=#%@";

interface ParticleFlowDetail {
  spread: number;
  phaseX: number;
  phaseY: number;
  rotZ: number;
}

const DEFAULT_FLOW: ParticleFlowDetail = {
  spread: 0,
  phaseX: 0,
  phaseY: 0,
  rotZ: 0,
};

export function AsciiVideoOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastDrawTimeRef = useRef(0);
  const particleFlowRef = useRef<ParticleFlowDetail>(DEFAULT_FLOW);

  const ensureSampleCanvas = () => {
    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement("canvas");
    }
    return sampleCanvasRef.current;
  };

  const drawFrame = useCallback(function tick(time: number) {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = window.requestAnimationFrame(tick);
      return;
    }

    if (time - lastDrawTimeRef.current < 45) {
      rafRef.current = window.requestAnimationFrame(tick);
      return;
    }
    lastDrawTimeRef.current = time;

    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const sampleCanvas = ensureSampleCanvas();
    const cols = Math.max(48, Math.min(140, Math.floor(width / 8)));
    const rows = Math.max(24, Math.min(84, Math.floor(height / 12)));
    sampleCanvas.width = cols;
    sampleCanvas.height = rows;

    const sampleCtx = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const ctx = canvas.getContext("2d");
    if (!sampleCtx || !ctx) {
      rafRef.current = window.requestAnimationFrame(tick);
      return;
    }

    sampleCtx.save();
    sampleCtx.translate(cols, 0);
    sampleCtx.scale(-1, 1);
    sampleCtx.drawImage(video, 0, 0, cols, rows);
    sampleCtx.restore();
    const imageData = sampleCtx.getImageData(0, 0, cols, rows).data;

    const cellW = width / cols;
    const cellH = height / rows;
    const fontSize = Math.max(8, Math.floor(cellH * 1.02));
    const flow = particleFlowRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textBaseline = "top";

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const offset = (y * cols + x) * 4;
        const r = imageData[offset];
        const g = imageData[offset + 1];
        const b = imageData[offset + 2];

        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const idx = Math.floor((1 - luminance) * (ASCII_RAMP.length - 1));
        const glyph = ASCII_RAMP[idx] ?? " ";
        if (glyph === " ") continue;
        if (luminance > 0.62 && (x + y) % 2 === 1) continue;

        const nx = x / Math.max(1, cols - 1) - 0.5;
        const ny = y / Math.max(1, rows - 1) - 0.5;
        const swirlX =
          Math.sin(ny * 7.3 + flow.phaseX * 4.6 + flow.rotZ * 3.5) *
          flow.spread *
          cellW *
          2.6;
        const driftY =
          Math.cos(nx * 8.1 + flow.phaseY * 4.4 - flow.rotZ * 2.1) *
          flow.spread *
          cellH *
          2.2;
        const drawX = x * cellW + swirlX + nx * flow.spread * 14;
        const drawY = y * cellH + driftY;

        const warm = Math.floor(124 + luminance * 120);
        const alpha = 0.11 + luminance * 0.36;
        ctx.fillStyle = `rgba(${warm}, ${Math.floor(warm * 0.78)}, ${Math.floor(
          warm * 0.52,
        )}, ${alpha})`;
        ctx.fillText(glyph, drawX, drawY);
      }
    }

    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  const stopCapture = useCallback(async (updateState = true) => {
    runningRef.current = false;
    window.cancelAnimationFrame(rafRef.current);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (updateState) {
      setIsActive(false);
    }
  }, []);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      runningRef.current = true;
      setIsActive(true);
      lastDrawTimeRef.current = 0;
      rafRef.current = window.requestAnimationFrame(drawFrame);
    } catch {
      setError("camera unavailable");
    }
  }, [drawFrame]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("threesam:ascii-video-active", {
        detail: { active: isActive },
      }),
    );
  }, [isActive]);

  useEffect(() => {
    const onParticleFlow = (event: Event) => {
      const customEvent = event as CustomEvent<ParticleFlowDetail>;
      if (!customEvent.detail) return;
      particleFlowRef.current = customEvent.detail;
    };
    window.addEventListener("threesam:particle-flow", onParticleFlow);

    return () => {
      window.dispatchEvent(
        new CustomEvent("threesam:ascii-video-active", {
          detail: { active: false },
        }),
      );
      void stopCapture(false);
      window.removeEventListener("threesam:particle-flow", onParticleFlow);
    };
  }, [stopCapture]);

  return (
    <>
      <video ref={videoRef} className="hidden" playsInline muted />

      <button
        type="button"
        onClick={() => void (isActive ? stopCapture() : startCapture())}
        className="absolute right-20 top-4 z-40 rounded-full border border-amber-200/35 bg-[#24120c]/75 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-amber-100/90 backdrop-blur-md transition hover:border-amber-200/65 md:right-24 md:top-6"
      >
        {isActive ? "stop video" : "grab video"}
      </button>

      {error ? (
        <div className="pointer-events-none absolute right-20 top-13 z-40 font-mono text-[10px] text-amber-300 md:right-24 md:top-15">
          {error}
        </div>
      ) : null}

      {isActive ? (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-60 mix-blend-screen"
          aria-hidden
        />
      ) : null}
    </>
  );
}
