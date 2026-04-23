import type { Sketch } from "../types";

// The crowd — procedural stick figures walking along a gentle NE-biased
// flow field. Walkers are scattered across the canvas at init and wrap
// asteroids-style: exit the right edge → re-enter from the left at the
// same y; exit the top → re-enter from the bottom at the same x. This
// keeps the population stable and evenly distributed regardless of how
// the flow field bunches them up. Each walker's proportions are fixed
// at spawn. Short fading trail so recent paths remain faintly visible.
export const day30: Sketch = {
  slug: "30",
  title: "the crowd",
  date: "2022-01-30",
  description: "do not hold bodies in memory longer than they need holding",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;

    // Flow field uses curl-of-noise (divergence-free). A naive
    // "angle = noise * 2π" field has convergent sinks where flows
    // drain in — walkers pool there within a few seconds and the
    // scene reads as aggregated blobs in the gutters. Curl-of-noise
    // has zero divergence by construction (∂F_x/∂x + ∂F_y/∂y = 0)
    // so walkers circulate through regions rather than pooling.
    const noiseScale = 0.005;
    const curlStep = 0.02; // noise-coord step for the central difference

    // Soft NE drift. Kept low so the curl's natural circulation still
    // reads as the dominant motion; too much bias flattens curl back
    // into a directional stream.
    const biasStrength = 0.15;
    const biasAngle = -Math.PI / 4; // NE in screen coords (y+ down)
    const biasDX = Math.cos(biasAngle) * biasStrength;
    const biasDY = Math.sin(biasAngle) * biasStrength;

    // Flocking separation via uniform spatial hash. Radius is sized so
    // walkers (roughly 40–70 CSS px tall limb-stretched figures) don't
    // visibly overlap — the old 14 let walker arms intersect because
    // the "center" distance stayed below visual body half-width. Cell
    // size matches radius so each walker checks its own cell + 8
    // neighbors, bounding the per-frame cost at a known density.
    const REPEL_RADIUS = 24;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const CELL = REPEL_RADIUS;
    // Quadratic falloff (s²) gives a hard "no touching" core — force
    // ramps steeply as walkers close in, then fades gently at the
    // edge of the radius so the flow field still dominates outside
    // the personal-space bubble.
    const SEPARATION_GAIN = 1.2;

    interface Walker {
      x: number;
      y: number;
      // Per-walker speed: range around 1.0. Without this, walkers that
      // end up in the same current move in perfect lockstep and read as
      // a wave. Small spread is enough to dissolve the convoy feel.
      speed: number;
      // proportions — set once at spawn, immutable thereafter
      quarter: number;
      half: number;
      limbLength: number;
      torsoWidthOffset: number;
      torsoLength: number;
      neck: number;
      color: number;
    }

    const walkers: Walker[] = [];
    const TARGET = 900;

    const halfW = w / 2;
    const halfH = h / 2;

    function spawn(): Walker {
      const quarter = map(rng(), 0, 1, 1.5, 4.5);
      return {
        x: 0,
        y: 0,
        speed: map(rng(), 0, 1, 0.8, 1.5),
        quarter,
        half: quarter * 2,
        limbLength: map(rng(), 0, 1, 22, 34),
        torsoWidthOffset: map(rng(), 0, 1, 1.5, quarter),
        torsoLength: map(rng(), 0, 1, 12, 22),
        neck: rng() * quarter,
        color: Math.floor(map(rng(), 0, 1, 140, 255)),
      };
    }

    // Seed the viewport at t=0 with a jittered grid. The earlier version
    // spawned walkers from a band off-screen and throttled them in — it
    // looked like a single convoy entering from the bottom-left instead
    // of a crowd. Pre-populating reads as a fully-inhabited scene from
    // the first frame; the asteroids wrap keeps the population stable.
    const cols = Math.max(1, Math.floor(Math.sqrt((TARGET * w) / h)));
    const rows = Math.ceil(TARGET / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    for (let r = 0; r < rows && walkers.length < TARGET; r++) {
      for (let c = 0; c < cols && walkers.length < TARGET; c++) {
        const wk = spawn();
        // Jitter within ±40% of cell size — enough to break up the grid
        // visually but keeps coverage uniform.
        wk.x = -halfW + (c + 0.5 + (rng() - 0.5) * 0.8) * cellW;
        wk.y = -halfH + (r + 0.5 + (rng() - 0.5) * 0.8) * cellH;
        walkers.push(wk);
      }
    }

    function drawWalker(wk: Walker) {
      const q = wk.quarter;
      const h2 = wk.half;
      const torsoW = h2 - wk.torsoWidthOffset;
      const tl = wk.torsoLength;
      const ll = wk.limbLength;
      const minPossible = 0.025;

      ctx.strokeStyle = `rgb(${wk.color},${wk.color},${wk.color})`;
      ctx.lineWidth = 1;

      ctx.save();
      // Draw calls are deterministic per-figure (no per-frame randomness)
      // so the same walker looks consistent as it moves. We reuse rng()
      // intentionally to vary which limbs appear per frame — keeps figures
      // jittery like the original static version.
      if (rng() > minPossible) ctx.strokeRect(0, -h2 - wk.neck, h2, h2);
      if (rng() > minPossible) ctx.strokeRect(wk.torsoWidthOffset / 2, 0, torsoW, tl);
      const armTilt = rng() * (Math.PI / 90);
      ctx.rotate(armTilt);
      if (rng() > minPossible) ctx.strokeRect(h2, 0, q, ll * (1 + rng() * 0.3));
      ctx.rotate(-armTilt);
      if (rng() > minPossible) ctx.strokeRect(-q, 0, q, ll * (1 + rng() * 0.3));
      ctx.translate(0, tl);
      if (rng() > minPossible) ctx.strokeRect(q, 0, q, ll * (1 + rng() * 0.3));
      if (rng() > minPossible) ctx.strokeRect(0, 0, q, ll * (1 + rng() * 0.3));
      ctx.restore();
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);

    // Wrap window extends slightly beyond the viewport so walkers don't
    // visibly teleport at the exact edge — they drift off, cross a small
    // margin, then re-enter from the opposite side.
    const MARGIN = 80;
    const wrapW = w + MARGIN * 2;
    const wrapH = h + MARGIN * 2;

    // Reusable spatial hash — rebuilt each frame.
    const grid = new Map<number, Walker[]>();
    function cellKey(cx: number, cy: number) {
      // Offset to keep keys non-negative for bit-packing.
      return ((cx + 4096) << 13) | (cy + 4096);
    }

    return {
      tick() {
        // Short-trail fade at 13% per frame — imprints visibly gone in
        // ~22 frames; reads as a streaming crowd, not accumulation.
        ctx.fillStyle = "rgba(0,0,0,0.13)";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(halfW, halfH);

        // Rebuild spatial hash.
        grid.clear();
        for (let i = 0; i < walkers.length; i++) {
          const wk = walkers[i];
          const cx = Math.floor(wk.x / CELL);
          const cy = Math.floor(wk.y / CELL);
          const k = cellKey(cx, cy);
          const bucket = grid.get(k);
          if (bucket) bucket.push(wk);
          else grid.set(k, [wk]);
        }

        for (let i = 0; i < walkers.length; i++) {
          const wk = walkers[i];
          // Curl-of-noise: treat `noise` as a stream function ψ and
          // take its 2D curl — F = (∂ψ/∂y, -∂ψ/∂x) — via central
          // differences. Four noise lookups per walker; 900 × 4 =
          // ~3600/frame, negligible at 60fps.
          const nx = wk.x * noiseScale;
          const ny = wk.y * noiseScale;
          const dnx = (noise(nx + curlStep, ny) - noise(nx - curlStep, ny)) / (2 * curlStep);
          const dny = (noise(nx, ny + curlStep) - noise(nx, ny - curlStep)) / (2 * curlStep);
          const flowLen = Math.hypot(dny, -dnx) || 1;
          const fx = dny / flowLen;
          const fy = -dnx / flowLen;
          const dx = fx * (1 - biasStrength) + biasDX;
          const dy = fy * (1 - biasStrength) + biasDY;
          const angle = Math.atan2(dy, dx);

          // Collision avoidance: check 3x3 neighborhood for walkers
          // within REPEL_RADIUS and push away from them.
          let repelX = 0;
          let repelY = 0;
          const cx = Math.floor(wk.x / CELL);
          const cy = Math.floor(wk.y / CELL);
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const bucket = grid.get(cellKey(cx + ox, cy + oy));
              if (!bucket) continue;
              for (let j = 0; j < bucket.length; j++) {
                const other = bucket[j];
                if (other === wk) continue;
                const ddx = wk.x - other.x;
                const ddy = wk.y - other.y;
                const d2 = ddx * ddx + ddy * ddy;
                if (d2 > 0 && d2 < REPEL_RADIUS_SQ) {
                  const d = Math.sqrt(d2);
                  const linear = (REPEL_RADIUS - d) / REPEL_RADIUS;
                  // Quadratic so force grows sharply as walkers get
                  // close — keeps personal-space bubble firm.
                  const s = linear * linear;
                  repelX += (ddx / d) * s;
                  repelY += (ddy / d) * s;
                }
              }
            }
          }

          // Light per-frame angular jitter (±~0.3 rad). Curl-noise
          // already circulates naturally so heavy jitter just masks
          // the field; this is enough to keep neighbors from
          // lockstepping without dissolving the curl shapes.
          const jitter = (rng() - 0.5) * 0.6;
          const moveAngle = angle + jitter;
          wk.x += Math.cos(moveAngle) * wk.speed + repelX * SEPARATION_GAIN;
          wk.y += Math.sin(moveAngle) * wk.speed + repelY * SEPARATION_GAIN;

          // Asteroids wrap. Exit right → enter left at same y. Exit top
          // → enter bottom at same x. And vice versa. Uses the extended
          // wrap window so the teleport happens just off-screen, not at
          // the visible edge.
          if (wk.x > halfW + MARGIN) wk.x -= wrapW;
          else if (wk.x < -halfW - MARGIN) wk.x += wrapW;
          if (wk.y > halfH + MARGIN) wk.y -= wrapH;
          else if (wk.y < -halfH - MARGIN) wk.y += wrapH;

          ctx.save();
          ctx.translate(wk.x, wk.y);
          ctx.rotate(angle + Math.PI / 2); // face direction of travel
          drawWalker(wk);
          ctx.restore();
        }

        ctx.restore();
      },
    };
  },
};
