// Shared audio engine for /sounds. One <audio> element + a Web Audio AnalyserNode.
// Drives both the transport UI and the reactive eye-ocean background.
//
// Components import `player` (reactive $state) to read playback + frequency bands,
// and call playTrack / toggle / seek. The <audio> element lives in +page.svelte
// and registers itself via attach().
import { tick } from "svelte";

export interface Track {
  src: string; // full URL (base already applied)
  title: string;
  variant: string;
  slug: string;
}

export const player = $state({
  track: null as Track | null,
  playing: false,
  currentTime: 0,
  duration: 0,
  // normalized 0..1 frequency-band energy, smoothed
  bass: 0,
  treble: 0,
  amp: 0,
});

let el: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let freq: Uint8Array<ArrayBuffer> | null = null;
let raf = 0;
let lastUi = 0;

export function attach(node: HTMLAudioElement) {
  el = node;
}

// Web Audio graph is built lazily on first play (AudioContext needs a gesture).
// createMediaElementSource may only run once per element.
function ensureGraph() {
  if (!el || ctx) return;
  ctx = new AudioContext();
  const source = ctx.createMediaElementSource(el);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  freq = new Uint8Array(analyser.frequencyBinCount);
}

const bandAvg = (data: Uint8Array, lo: number, hi: number) => {
  let sum = 0;
  for (let i = lo; i < hi; i++) sum += data[i];
  return sum / ((hi - lo) * 255);
};

function loop() {
  if (!player.playing) { raf = 0; return; } // stop the loop when paused/stopped
  raf = requestAnimationFrame(loop);
  const now = performance.now();
  // bands feed the canvas (read in its own rAF) → full rate; the transport's
  // time readout + scrubber only need ~10fps, so throttle those reactive writes.
  if (el && now - lastUi >= 100) {
    lastUi = now;
    player.currentTime = el.currentTime;
    player.duration = Number.isFinite(el.duration) ? el.duration : 0;
  }
  if (analyser && freq) {
    analyser.getByteFrequencyData(freq);
    const n = freq.length;
    player.bass = bandAvg(freq, 0, Math.max(1, Math.floor(n * 0.12)));
    player.treble = bandAvg(freq, Math.floor(n * 0.45), n);
    player.amp = bandAvg(freq, 0, n);
  }
}

async function start() {
  if (!el) return;
  ensureGraph();
  if (ctx?.state === "suspended") await ctx.resume();
  await el.play();
  player.playing = true;
  if (!raf) loop();
}

export async function playTrack(t: Track) {
  if (!el) return;
  if (player.track?.src === t.src) {
    await toggle();
    return;
  }
  player.track = t;
  await tick(); // let the bound src update before play()
  await start();
}

export async function toggle() {
  if (!el || !player.track) return;
  if (player.playing) {
    el.pause();
    player.playing = false;
  } else {
    await start();
  }
}

export function seek(seconds: number) {
  if (el && Number.isFinite(seconds)) el.currentTime = seconds;
}

export function onEnded() {
  player.playing = false;
}
