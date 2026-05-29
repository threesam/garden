<script lang="ts">
  // Fullscreen audio-reactive "eye ocean" backdrop. A grid of cream eyes whose
  // size + scatter flow with the playing track: bass swells the eyes, treble
  // speeds the noise flow. Idle (paused) → a slow ambient drift so it breathes.
  import { onMount } from "svelte";
  import { makeNoise } from "$lib/art/noise";
  import { player } from "$lib/sounds/player.svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const noise = makeNoise(25); // day25 "eye ocean" seed
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function frame() {
      raf = requestAnimationFrame(frame);
      const react = player.playing ? 1 : 0;
      const bass = player.bass * react;
      const treble = player.treble * react;
      const amp = player.amp * react;
      t += 0.0011 + treble * 0.03; // ambient drift + treble-driven flow

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const cell = Math.max(40, Math.min(70, Math.min(w, h) / 15));
      const base = cell * 0.42;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;

      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const n = noise(gx * 0.16, gy * 0.16, t);
          const m = noise(gx * 0.16 + 11.5, gy * 0.16, t);
          const cx = gx * cell + (n - 0.5) * cell * 0.55;
          const cy = gy * cell + (m - 0.5) * cell * 0.55;
          const size = base * (0.4 + n * 0.95) * (1 + bass * 1.15);
          if (size < 1) continue;

          // sclera
          ctx.fillStyle = `rgba(255,250,200,${0.42 + n * 0.5})`;
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fill();

          // pupil — dilates with overall amplitude, drifts slowly
          const pupil = Math.max(1.5, size * 0.3 * (1 + amp * 0.6));
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.arc(cx + Math.sin(t * 2 + gx) * size * 0.05, cy + Math.cos(t * 2 + gy) * size * 0.05, pupil / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true" style="position:fixed; inset:0; z-index:0; display:block;"></canvas>
