// The wordmark's animation clock.
//
// One rAF for the whole mark, not one per letter: the dots are drawn by eight
// separate canvases (each letter needs its own box so the snake sequence can
// collapse them individually), but they must sample the same field at the same
// instant or the wave would tear at the letter seams.
//
// Ported from sixtom's hero field (static/bubbles.js), which is itself
// descended from the day20 "sea of shapes" sketch in this repo — a slow
// drifting value-noise field where a dot's radius and alpha track its local
// noise value, so contiguous blobs of swell travel through rather than
// everything pulsing in unison.

import { makeNoise } from '$lib/art/noise';

/** Tuned on the motion bench against the real mark on --coin. */
export const FIELD = {
  /** Noise units per grid cell. Higher = smaller, more numerous blobs. */
  scale: 0.26,
  /** Noise units per ms the field drifts. */
  speed: 24e-6,
  /** Drift direction, degrees. */
  angle: 20,
  /** Dot radius as a fraction of its resting size, at lowest/highest noise. */
  radius: [0.69, 1.13],
  /** Dot alpha at lowest/highest noise. */
  alpha: [0.62, 1],
  seed: 20,
} as const;

const FPS = 20;
const FRAME_MS = 1000 / FPS;
/** A representative mid-drift moment, used as the single reduced-motion frame. */
const STATIC_FRAME = 3400;

export const noise = makeNoise(FIELD.seed);

const rad = (FIELD.angle * Math.PI) / 180;
const DX = Math.cos(rad) * FIELD.speed;
const DY = Math.sin(rad) * FIELD.speed;

/** Noise value for a dot at grid position (gx, gy) at time `elapsed` ms. */
export function fieldAt(gx: number, gy: number, elapsed: number): number {
  return noise(gx * FIELD.scale + elapsed * DX, gy * FIELD.scale + elapsed * DY);
}

/** Linear map from [0,1] onto [a,b]. */
export function lerp(n: number, a: number, b: number): number {
  return a + n * (b - a);
}

// Accumulated animation time. Only advances across rendered frames, so pausing
// (tab hidden, no subscribers) resumes the drift where it stopped instead of
// snapping forward by the time spent away.
export const clock = $state({ elapsed: STATIC_FRAME });

let subscribers = 0;
let raf = 0;
let lastRender = 0;
let running = false;

function frame(now: number) {
  if (!running) return;
  if (now - lastRender >= FRAME_MS) {
    if (lastRender) clock.elapsed += now - lastRender;
    lastRender = now;
  }
  raf = requestAnimationFrame(frame);
}

function start() {
  if (running || subscribers === 0 || document.hidden) return;
  // Reduced motion is enforced here rather than at subscribe(): subscribers
  // still refcount normally, the loop simply never runs, so `clock.elapsed`
  // stays at STATIC_FRAME and every letter paints one representative still.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  running = true;
  lastRender = 0; // re-anchor without advancing → no jump on resume
  raf = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

/**
 * Run the clock while at least one letter is mounted. Returns the teardown.
 * Under prefers-reduced-motion the loop never starts — see `start()`.
 */
export function subscribe(): () => void {
  subscribers += 1;
  if (subscribers === 1) {
    document.addEventListener('visibilitychange', onVisibility);
    start();
  }
  return () => {
    subscribers -= 1;
    if (subscribers === 0) {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    }
  };
}

function onVisibility() {
  if (document.hidden) stop();
  else start();
}
