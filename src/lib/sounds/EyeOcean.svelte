<script lang="ts">
  // Audio-reactive "eye ocean" — a grid of cream eyes displaced + flowed by 3D
  // value noise. Two modes:
  //   • backdrop (default): fullscreen-fixed, wired to the sounds player — bass
  //     swells the eyes, treble speeds the flow, amplitude dilates the pupils.
  //   • card (reactive={false} fixed={false}): sizes to its parent box and just
  //     drifts in the idle state — used as the homepage /sounds preview tile.
  //
  // Perf: 1× DPR (it's a soft backdrop), frame-throttled (30fps reacting / 12fps
  // idle), paused when the tab is hidden. No backdrop-filter is layered over it.
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
    let t = 0;
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

    function draw(playing: boolean) {
      if (w < 2 || h < 2) return; // not sized yet (card mode can mount before layout); the RO will size us
      const react = playing ? 1 : 0;
      const bass = player.bass * react;
      const treble = player.treble * react;
      const amp = player.amp * react;
      t += 0.03 + treble * 0.6; // per-rendered-frame drift (throttled, so larger step)

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const cell = Math.max(48, Math.min(80, Math.min(w, h) / 12));
      const base = cell * 0.42;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;

      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const n = noise(gx * 0.16, gy * 0.16, t);
          const cx = gx * cell + (n - 0.5) * cell * 0.5;
          const cy = gy * cell + (noise(gx * 0.16 + 11.5, gy * 0.16, t) - 0.5) * cell * 0.5;
          const size = base * (0.4 + n * 0.95) * (1 + bass * 1.15);
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
      if (document.hidden) return;
      const playing = reactive && player.playing;
      const interval = playing ? 33 : 80; // 30fps reacting, 12fps idle drift
      if (now - last < interval) return;
      last = now;
      draw(playing);
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
