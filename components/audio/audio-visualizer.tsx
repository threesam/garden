"use client";

import { useEffect, useRef } from "react";
import type { AudioBands } from "@/components/audio/audio-reactive-provider";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  onEnergySample: (value: number) => void;
  onBandsSample?: (bands: AudioBands) => void;
  drawBackground?: boolean;
  className?: string;
  energyBoost?: number;
}

// Frequency bin ranges for fftSize=1024 (512 bins), sampleRate=44100
// Each bin = ~43Hz
const BASS_END = 5;      // 0-215Hz
const MID_END = 46;      // 215-2kHz
// 46-512 = high          // 2k-22kHz

const ONSET_THRESHOLD = 1.8;  // spike must be Nx the rolling average
const ONSET_DECAY = 0.92;

function bandAverage(buffer: Uint8Array, from: number, to: number): number {
  let sum = 0;
  const end = Math.min(to, buffer.length);
  for (let i = from; i < end; i++) sum += buffer[i];
  return sum / Math.max(1, end - from) / 255;
}

export function AudioVisualizer({
  analyser,
  isActive,
  onEnergySample,
  onBandsSample,
  drawBackground = true,
  className,
  energyBoost = 1.8,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isActive) {
      onEnergySample(0);
      onBandsSample?.({ bass: 0, mid: 0, high: 0, onset: 0 });
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const fftBuffer = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainBuffer = new Uint8Array(analyser.fftSize);
    let smoothedEnergy = 0;
    let smoothedBass = 0;
    let smoothedMid = 0;
    let smoothedHigh = 0;
    let onsetValue = 0;
    let rollingEnergy = 0;

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

      // --- frequency bands ---
      const rawBass = bandAverage(fftBuffer, 0, BASS_END);
      const rawMid = bandAverage(fftBuffer, BASS_END, MID_END);
      const rawHigh = bandAverage(fftBuffer, MID_END, fftBuffer.length);

      const bandSmooth = 0.8;
      smoothedBass = smoothedBass * bandSmooth + rawBass * (1 - bandSmooth);
      smoothedMid = smoothedMid * bandSmooth + rawMid * (1 - bandSmooth);
      smoothedHigh = smoothedHigh * bandSmooth + rawHigh * (1 - bandSmooth);

      // --- onset detection ---
      const instantEnergy = (rawBass * 2 + rawMid + rawHigh) / 4;
      rollingEnergy = rollingEnergy * 0.95 + instantEnergy * 0.05;
      if (instantEnergy > rollingEnergy * ONSET_THRESHOLD && rollingEnergy > 0.02) {
        onsetValue = 1;
      } else {
        onsetValue *= ONSET_DECAY;
      }

      // --- overall energy (existing logic) ---
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
      const gatedEnergy =
        normalizedEnergy < 0.1 ? 0 : (normalizedEnergy - 0.1) / 0.9;
      smoothedEnergy = smoothedEnergy * 0.9 + gatedEnergy * 0.1;
      onEnergySample(Math.min(2.3, smoothedEnergy * energyBoost));

      onBandsSample?.({
        bass: Math.min(1, smoothedBass * 2.5),
        mid: Math.min(1, smoothedMid * 2.5),
        high: Math.min(1, smoothedHigh * 3),
        onset: Math.min(1, onsetValue),
      });

      rafId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(rafId);
      onEnergySample(0);
      onBandsSample?.({ bass: 0, mid: 0, high: 0, onset: 0 });
    };
  }, [analyser, isActive, onEnergySample, onBandsSample, drawBackground, energyBoost]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-36 w-full rounded-xl border border-white/10 bg-black/40"}
    />
  );
}
