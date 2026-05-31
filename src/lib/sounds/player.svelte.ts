// Shared audio engine for /sounds — one <audio> element driving the transport UI.
//
// Components import `player` (reactive $state) to read playback state and call
// playTrack / toggle / seek. The <audio> element lives in +page.svelte and
// registers itself via attach().
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
});

let el: HTMLAudioElement | null = null;
let raf = 0;
let lastUi = 0;
let scrubbing = false; // true while the user drags the scrubber — pauses loop() time-writes

export function attach(node: HTMLAudioElement) {
  if (node === el) return;
  // New element (e.g. SPA re-navigation remounts the page) → stop the old loop and
  // reset playback state (module-level $state survives the remount) so the new
  // (paused) element isn't shown as still-playing.
  if (el) {
    cancelAnimationFrame(raf);
    raf = 0;
    el.pause(); // stop the outgoing element before we drop our reference to it
    player.playing = false;
    player.currentTime = 0;
    player.duration = 0;
  }
  el = node;
}

function loop() {
  if (!player.playing) { raf = 0; return; } // stop the loop when paused/stopped
  raf = requestAnimationFrame(loop);
  // the transport's time readout + scrubber only need ~10fps
  const now = performance.now();
  if (el && !scrubbing && now - lastUi >= 100) {
    lastUi = now;
    player.currentTime = el.currentTime;
    player.duration = Number.isFinite(el.duration) ? el.duration : 0;
  }
}

async function start() {
  if (!el) return;
  try {
    await el.play();
  } catch {
    player.playing = false; // autoplay blocked or interrupted by a newer load
    return;
  }
  player.playing = true;
  lastUi = 0; // first loop tick writes time/duration immediately (no stale flash on track switch)
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
  if (el && Number.isFinite(seconds)) {
    el.currentTime = seconds;
    player.currentTime = el.currentTime; // browser-clamped position, reflected even while paused
  }
}

// the page toggles this while dragging the scrubber so loop() doesn't yank the thumb
export function setScrubbing(on: boolean) {
  scrubbing = on;
}
