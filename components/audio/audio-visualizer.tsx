"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  onEnergySample: (value: number) => void;
  drawBackground?: boolean;
  className?: string;
  energyBoost?: number;
}

export function AudioVisualizer({
  analyser,
  isActive,
  onEnergySample,
  drawBackground = true,
  className,
  energyBoost = 1.8,
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
    const timeDomainBuffer = new Uint8Array(analyser.fftSize);

    const draw = () => {
      analyser.getByteFrequencyData(fftBuffer);
      analyser.getByteTimeDomainData(timeDomainBuffer);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      if (drawBackground) {
        ctx.fillStyle = "rgba(8, 10, 16, 0.9)";
        ctx.fillRect(0, 0, width, height);
      }

      const barCount = 64;
      const barWidth = width / barCount;
      let energyAccumulator = 0;
      let weightSum = 0;

      let rms = 0;
      for (let i = 0; i < timeDomainBuffer.length; i += 1) {
        const centered = (timeDomainBuffer[i] - 128) / 128;
        rms += centered * centered;
      }
      rms = Math.sqrt(rms / Math.max(1, timeDomainBuffer.length));

      for (let i = 0; i < barCount; i += 1) {
        const normalized = i / Math.max(1, barCount - 1);
        const skewed = Math.pow(normalized, 1.85);
        const binIndex = Math.min(
          fftBuffer.length - 1,
          Math.floor(skewed * (fftBuffer.length - 1)),
        );
        const raw = fftBuffer[binIndex] / 255;
        const boosted = Math.pow(raw, 0.58);
        const value = Math.min(1, boosted * 0.85 + rms * 0.65);
        const weight = normalized < 0.68 ? 1.35 : 0.85;
        energyAccumulator += value * weight;
        weightSum += weight;

        const barHeight = value * (height - 8);
        const x = i * barWidth;
        const y = height - barHeight;
        const hue = 10 + value * 36;
        ctx.fillStyle = `hsla(${hue}, 92%, 64%, 0.82)`;
        ctx.fillRect(x, y, barWidth - 1.2, barHeight);
      }

      const normalizedEnergy = energyAccumulator / Math.max(1, weightSum);
      onEnergySample(Math.min(2.3, normalizedEnergy * energyBoost));
      rafId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(rafId);
      onEnergySample(0);
    };
  }, [analyser, isActive, onEnergySample, drawBackground, energyBoost]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-36 w-full rounded-xl border border-white/10 bg-black/40"}
    />
  );
}
