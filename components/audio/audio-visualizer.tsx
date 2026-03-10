"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  onEnergySample: (value: number) => void;
  drawBackground?: boolean;
  className?: string;
}

export function AudioVisualizer({
  analyser,
  isActive,
  onEnergySample,
  drawBackground = true,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isActive) {
      onEnergySample(0);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const fftBuffer = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(fftBuffer);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      if (drawBackground) {
        ctx.fillStyle = "rgba(8, 10, 16, 0.9)";
        ctx.fillRect(0, 0, width, height);
      }

      const barCount = 56;
      const step = Math.max(1, Math.floor(fftBuffer.length / barCount));
      const barWidth = width / barCount;
      let energyAccumulator = 0;

      for (let i = 0; i < barCount; i += 1) {
        const value = fftBuffer[i * step] / 255;
        energyAccumulator += value;

        const barHeight = value * (height - 8);
        const x = i * barWidth;
        const y = height - barHeight;
        const hue = 10 + value * 36;
        ctx.fillStyle = `hsla(${hue}, 92%, 64%, 0.82)`;
        ctx.fillRect(x, y, barWidth - 1.2, barHeight);
      }

      onEnergySample(energyAccumulator / barCount);
      rafId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(rafId);
      onEnergySample(0);
    };
  }, [analyser, isActive, onEnergySample, drawBackground]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-36 w-full rounded-xl border border-white/10 bg-black/40"}
    />
  );
}
