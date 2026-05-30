<script lang="ts">
  // Audio-reactive "eye ocean" — a grid of cream eyes displaced + flowed by 3D
  // value noise. Two modes:
  //   • backdrop (default): fullscreen-fixed, wired to the sounds player — bass
  //     swells the eyes, treble speeds the flow, amplitude dilates the pupils.
  //   • card (reactive={false} fixed={false}): sizes to its parent box and just
  //     drifts in the idle state — used as the homepage /sounds preview tile.
  //
  // Motion (after the sixtom hero): a low-frequency value-noise field drifts
  // across the grid at an asymmetric rate (Y at 0.4× of X) so soft blobs of
  // larger/brighter eyes flow through like a slow current, rather than each eye
  // churning in place. Continuous + delta-timed at the native rAF rate; paused
  // when hidden. Perf: 1× DPR (soft backdrop), light per-eye arcs, no blur.
  import { onMount } from "svelte";
  import { makeNoise } from "$lib/art/noise";
  import { player } from "$lib/sounds/player.svelte";

  interface Props {
    /** Wire to the sounds player. false = always idle drift, no audio reactivity. */
    reactive?: boolean;
    /** true = fullscreen fixed backdrop; false = absolute, sized to the parent element. */
    fixed?: boolean;
  }
  let { reactive = true, fixed = true }: Props = $props();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const noise = makeNoise(25); // day25 "eye ocean" seed
    let w = 0;
    let h = 0;
    let raf = 0;
    let flow = 0; // accumulated drift distance (noise units); persists across pauses
    let last = 0;

    function applySize(width: number, height: number) {
      w = Math.max(1, Math.floor(width));
      h = Math.max(1, Math.floor(height));
      canvas.width = w; // 1× DPR — soft backdrop, big perf win on retina
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    // Backdrop tracks the viewport; card mode tracks its parent box.
    let onResize: (() => void) | undefined;
    let ro: ResizeObserver | undefined;
    if (fixed) {
      onResize = () => applySize(window.innerWidth, window.innerHeight);
      onResize();
      window.addEventListener("resize", onResize);
    } else {
      // Card mode: track the parent box (the gallery card's fill wrapper). The
      // RO fires once on observe() with the initial size, so the canvas catches
      // up even if layout isn't resolved at mount.
      const host = canvas.parentElement;
      if (host) {
        ro = new ResizeObserver(() => {
          const r = host.getBoundingClientRect();
          applySize(r.width, r.height);
        });
        ro.observe(host);
        const r = host.getBoundingClientRect();
        applySize(r.width, r.height);
      }
    }

    function draw(playing: boolean, dt: number) {
      if (w < 2 || h < 2) return; // not sized yet (card mode can mount before layout); the RO will size us
      const react = playing ? 1 : 0;
      const bass = player.bass * react;
      const treble = player.treble * react;
      const amp = player.amp * react;
      // Drift a low-frequency 2D noise field at an asymmetric rate (Y at 0.4× of
      // X), so contiguous blobs of larger/brighter eyes flow across the grid like
      // a slow current. Treble speeds the current when playing.
      flow += dt * (0.22 + treble * 1.1);
      const driftX = flow;
      const driftY = flow * 0.4;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const cell = Math.max(48, Math.min(80, Math.min(w, h) / 12));
      const base = cell * 0.42;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      // ~4 big contiguous blobs across the short side (sixtom: BLOBS / minDim).
      const blobScale = 4.2 / Math.min(w, h);

      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const px = gx * cell;
          const py = gy * cell;
          // the drifting field value at this cell — a blob slides through as it rises
          const n = noise(px * blobScale + driftX, py * blobScale + driftY, 0);
          // stable per-cell jitter so it doesn't read as a rigid grid, plus a
          // gentle lean that follows the slow current (coherent, not jittery)
          const jx = (noise(px * 0.05, py * 0.05, 5.3) - 0.5) * cell * 0.45;
          const jy = (noise(py * 0.05, px * 0.05, 8.7) - 0.5) * cell * 0.45;
          const cx = px + jx + (n - 0.5) * cell * 0.3 * (1 + bass * 0.6);
          const cy = py + jy + (n - 0.5) * cell * 0.2;
          const size = base * (0.32 + n * 1.0) * (1 + bass * 1.15);
          if (size < 1) continue;

          ctx.fillStyle = `rgba(255,250,200,${0.42 + n * 0.5})`;
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fill();

          const pupil = Math.max(1.5, size * 0.3 * (1 + amp * 0.6));
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.arc(cx, cy, pupil / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now; // don't bank elapsed time while hidden → no jump on return
        return;
      }
      // Native rAF rate (≈60fps) for fluid motion; delta-time keeps the drift
      // speed identical regardless of frame rate. Clamp dt so a backgrounded
      // tab returning doesn't lurch the field forward.
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      draw(reactive && player.playing, dt);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  });
</script>

<canvas
  bind:this={canvas}
  aria-hidden="true"
  style="position:{fixed ? 'fixed' : 'absolute'}; inset:0; z-index:0; display:block;"
></canvas>
