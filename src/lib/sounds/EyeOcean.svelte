<script lang="ts">
  // "Eye ocean" — a grid of cream eyes displaced + flowed by 2D value noise. Two
  // modes:
  //   • backdrop (default, fixed): fullscreen behind /sounds; pupils gaze toward
  //     the playing song's card (the `gaze` prop).
  //   • card (fixed={false}): sizes to its parent box; pupils follow the cursor —
  //     used as the homepage /sounds preview tile.
  // Idle, each eye looks in its own random direction, and one random eye blinks
  // each second. Not audio-reactive.
  //
  // Motion (after the sixtom hero): a low-frequency value-noise field drifts
  // across the grid at an asymmetric rate (Y at 0.4× of X) so soft blobs of
  // larger/brighter eyes flow through like a slow current, rather than each eye
  // churning in place. Continuous + delta-timed at the native rAF rate; paused
  // when hidden. Perf: 1× DPR (soft backdrop), light per-eye arcs, no blur.
  import { onMount } from "svelte";
  import { makeNoise } from "$lib/art/noise";

  interface Props {
    /** true = fullscreen fixed backdrop; false = absolute, sized to the parent element. */
    fixed?: boolean;
    /** Fixed backdrop only: a viewport point the pupils gaze toward (the playing
     *  song's card center). null = idle drift. Ignored in card mode. */
    gaze?: { x: number; y: number } | null;
  }
  let { fixed = true, gaze = null }: Props = $props();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const noise = makeNoise(25); // day25 "eye ocean" seed
    let w = 0;
    let h = 0;
    let raf = 0;
    let flow = 0; // accumulated drift distance (noise units); persists across pauses
    let last = 0;
    // one random eye blinks each second (a quick vertical squash)
    const BLINK_MS = 160;
    let blinkIdx = -1;
    let blinkStart = 0;
    let nextBlink = 0;
    // glance — the pupils lean toward a target: the cursor in card mode (see the
    // listener block), or the `gaze` prop in fixed mode (the playing song's card).
    // gtx/gty hold the target point; glance is the smoothed 0..1 engage strength.
    let ptrX = 0;
    let ptrY = 0;
    let ptrIn = false;
    let gtx = 0;
    let gty = 0;
    let glance = 0; // 0..1 smoothed glance strength

    // Size-derived constants + per-cell jitter are frame-invariant — computed
    // once per resize (below) instead of every frame in draw().
    let cell = 0;
    let base = 0;
    let cols = 0;
    let rows = 0;
    let blobScale = 0;
    const jitterX: number[] = [];
    const jitterY: number[] = [];
    const restX: number[] = []; // per-eye idle gaze direction (unit vector)
    const restY: number[] = [];

    function applySize(width: number, height: number) {
      w = Math.max(1, Math.floor(width));
      h = Math.max(1, Math.floor(height));
      canvas.width = w; // 1× DPR — soft backdrop, big perf win on retina
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      cell = Math.max(48, Math.min(80, Math.min(w, h) / 12));
      base = cell * 0.42;
      cols = Math.ceil(w / cell) + 1;
      rows = Math.ceil(h / cell) + 1;
      // ~4 big contiguous blobs across the short side (sixtom: BLOBS / minDim).
      blobScale = 4.2 / Math.min(w, h);
      // stable per-cell jitter so the grid doesn't read as a rigid grid
      jitterX.length = 0;
      jitterY.length = 0;
      restX.length = 0;
      restY.length = 0;
      blinkIdx = -1; // cell count changed — cancel any pending blink (re-rolls next tick)
      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const px = gx * cell;
          const py = gy * cell;
          jitterX.push((noise(px * 0.05, py * 0.05, 5.3) - 0.5) * cell * 0.45);
          jitterY.push((noise(py * 0.05, px * 0.05, 8.7) - 0.5) * cell * 0.45);
          // each eye rests looking in its own stable random direction
          const ang = noise(px * 0.07, py * 0.07, 13.1) * Math.PI * 2;
          restX.push(Math.cos(ang));
          restY.push(Math.sin(ang));
        }
      }
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

    // Cursor-tracking pupils — CARD MODE ONLY. On the fullscreen backdrop the grid
    // is hundreds of eyes; re-aiming every pupil at the moving cursor each frame
    // drops the frame rate, so there the eyes just drift (ptrIn stays false →
    // glance decays to 0 → the per-eye offset below is skipped). The card is a
    // handful of eyes, so tracking is cheap; offsetX/Y is canvas-local (no layout
    // read) and listening on the canvas naturally gates to hover.
    let detachPointer: (() => void) | undefined;
    if (!fixed) {
      const onPointerMove = (e: PointerEvent) => {
        ptrX = e.offsetX;
        ptrY = e.offsetY;
        ptrIn = true;
      };
      const onPointerGone = () => {
        ptrIn = false;
      };
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerGone);
      detachPointer = () => {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerGone);
      };
    }

    function draw(dt: number, now: number) {
      if (w < 2 || h < 2) return; // not sized yet (card mode can mount before layout); the RO will size us
      // Drift a low-frequency 2D noise field at an asymmetric rate (Y at 0.4× of X),
      // so contiguous blobs of larger/brighter eyes flow across the grid like a slow
      // current. Constant rate — the eyes are not audio-reactive.
      flow += dt * 0.22;
      const driftX = flow;
      const driftY = flow * 0.4;

      // every second, pick a random eye to blink
      if (now >= nextBlink) {
        blinkIdx = Math.floor(Math.random() * (rows + 1) * (cols + 1));
        blinkStart = now;
        nextBlink = now + 1000;
      }

      // Backdrop in --coin (#e8a317) — eyes are cream blobs floating on gold.
      ctx.fillStyle = "#e8a317";
      ctx.fillRect(0, 0, w, h);

      // Desired aim + engage strength this frame: the fixed backdrop follows the
      // `gaze` prop (the playing card); card mode follows the in-bounds cursor.
      let dtx = gtx;
      let dty = gty;
      let strength = 0;
      if (fixed && gaze) {
        dtx = gaze.x;
        dty = gaze.y;
        strength = 1;
      } else if (!fixed && ptrIn && ptrX >= 0 && ptrX <= w && ptrY >= 0 && ptrY <= h) {
        dtx = ptrX;
        dty = ptrY;
        strength = 1;
      }
      // Ease the aim point so the gaze glides between targets (song→song, or as the
      // card scrolls) rather than snapping; snap only while disengaged so the next
      // engage starts aimed right (the pupils are centered then anyway, via glance).
      if (glance < 0.01) {
        gtx = dtx;
        gty = dty;
      } else {
        gtx += (dtx - gtx) * Math.min(1, dt * 5);
        gty += (dty - gty) * Math.min(1, dt * 5);
      }
      // dt-corrected like the drift: ease the pupils toward the target, and back to
      // each eye's idle direction when it clears.
      glance += (strength - glance) * Math.min(1, dt * 8);

      let idx = 0;
      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const px = gx * cell;
          const py = gy * cell;
          // the drifting field value at this cell — a blob slides through as it rises
          const n = noise(px * blobScale + driftX, py * blobScale + driftY, 0);
          // precomputed per-cell jitter + a gentle lean that follows the current
          const ci = idx; // this cell's index into the precomputed arrays
          idx++;
          const cx = px + jitterX[ci] + (n - 0.5) * cell * 0.3;
          const cy = py + jitterY[ci] + (n - 0.5) * cell * 0.2;
          const size = base * (0.32 + n * 1.0);
          if (size < 1) continue;

          // blink: a quick vertical squash of the chosen eye (1 → ~0 → 1)
          let oy = 1;
          if (ci === blinkIdx) {
            const bp = (now - blinkStart) / BLINK_MS;
            if (bp <= 1) oy = Math.max(0.06, 1 - Math.sin(bp * Math.PI));
          }

          ctx.fillStyle = `rgba(255,250,200,${0.42 + n * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, size / 2, (size / 2) * oy, 0, 0, Math.PI * 2);
          ctx.fill();

          const pupil = Math.max(1.5, size * 0.3);
          const maxReach = ((size - pupil) / 2) * 0.8; // keeps the pupil inside the eye
          // idle: this eye looks in its own stable random direction
          const rox = restX[ci] * maxReach * 0.7;
          const roy = restY[ci] * maxReach * 0.7;
          // engaged: aim toward the eased gaze/cursor point
          let tox = rox;
          let toy = roy;
          if (glance > 0.001) {
            const ddx = gtx - cx;
            const ddy = gty - cy;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1; // cheaper than hypot, per eye
            tox = (ddx / dd) * maxReach;
            toy = (ddy / dd) * maxReach;
          }
          // blend idle → target by glance: eyes swing to the song, then ease home
          const ppx = cx + rox + (tox - rox) * glance;
          const ppy = cy + roy + (toy - roy) * glance;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.ellipse(ppx, cy + (ppy - cy) * oy, pupil / 2, (pupil / 2) * oy, 0, 0, Math.PI * 2);
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
      draw(dt, now);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      detachPointer?.();
      ro?.disconnect();
    };
  });
</script>

<canvas
  bind:this={canvas}
  aria-hidden="true"
  style="position:{fixed ? 'fixed' : 'absolute'}; inset:0; z-index:0; display:block;"
></canvas>
