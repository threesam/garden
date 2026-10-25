// Visuals are plugins. A Visual draws one frame from engine state and nothing
// else — no Date.now, no performance.now, no randomness that isn't seeded
// from the frame — so the same performance log replays to the same pictures
// when we render audio-visual pieces offline.

import type { ChannelView } from './engine.svelte';

export interface Frame {
  /** Engine sample clock and rate: the only notion of time a visual may use. */
  t: number;
  sampleRate: number;
  bar: number;
  bpm: number;
  playing: boolean;
  /** mic, keys, drums — in that order. */
  channels: readonly ChannelView[];
  width: number;
  height: number;
}

export interface Visual {
  id: string;
  draw(ctx: CanvasRenderingContext2D, frame: Frame): void;
}

/** A smoothed, decaying follower for a per-channel level; deterministic per frame sequence. */
class Follower {
  value = 0;
  feed(level: number, decay: number): number {
    this.value = Math.max(level, this.value * decay);
    return this.value;
  }
}

/**
 * The default: three monochrome layers. Keys are the background (slow bands
 * breathing with the bass), drums the middle ground (a pulse on every hit),
 * the mic the foreground (a trace of its level across the screen).
 */
function layers(): Visual {
  const keys = new Follower();
  const drums = new Follower();
  const trace = new Float32Array(160);
  let head = 0;
  let lastT = -1;
  return {
    id: 'layers',
    draw(ctx, f) {
      const { width: w, height: h } = f;
      const [mic, key, drum] = f.channels;
      ctx.fillStyle = '#0c0c0a';
      ctx.fillRect(0, 0, w, h);
      if (!key || !drum || !mic) return;
      const bars = f.t / f.bar;

      // background — keys: horizontal bands, brightness follows the bass
      const k = keys.feed(key.level, 0.94);
      const bands = 9;
      for (let i = 0; i < bands; i++) {
        const y = ((i + 0.5) / bands) * h;
        const wobble = Math.sin(bars * Math.PI * 2 * 0.25 + i * 0.9) * (key.fxWet * 12 + 2);
        const alpha = 0.04 + k * 0.5 * (0.5 + 0.5 * Math.sin(bars * Math.PI + i));
        ctx.fillStyle = `rgba(245,244,240,${alpha.toFixed(3)})`;
        ctx.fillRect(0, y - h / bands / 2 + wobble, w, (h / bands) * 0.6);
      }

      // middle — drums: a pulse from the centre on every hit, ring on the bar
      const d = drums.feed(drum.level, 0.85);
      const r = Math.min(w, h) * (0.12 + d * 0.35);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,244,240,${(d * 0.35).toFixed(3)})`;
      ctx.fill();
      if (drum.state === 'looping') {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.42, -Math.PI / 2, -Math.PI / 2 + drum.pos * Math.PI * 2);
        ctx.strokeStyle = `rgba(245,244,240,${(0.15 + drum.gate * 0.5).toFixed(3)})`;
        ctx.lineWidth = drum.fxWet > 0.5 ? 6 : 2;
        ctx.stroke();
      }

      // foreground — mic: a level trace scrolling with the sample clock
      if (f.t !== lastT) {
        lastT = f.t;
        trace[head] = mic.level;
        head = (head + 1) % trace.length;
      }
      ctx.beginPath();
      for (let i = 0; i < trace.length; i++) {
        const v = trace[(head + i) % trace.length] ?? 0;
        const x = (i / (trace.length - 1)) * w;
        const y = h * 0.5 - v * h * 0.4 * (i % 2 === 0 ? 1 : -1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(245,244,240,${(0.25 + mic.gate * 0.7).toFixed(3)})`;
      ctx.lineWidth = mic.fxWet > 0.5 ? 3 : 1.5;
      ctx.stroke();
    },
  };
}

/** Registry: add a visual here and it shows up in the picker. */
export const VISUALS: (() => Visual)[] = [layers];
