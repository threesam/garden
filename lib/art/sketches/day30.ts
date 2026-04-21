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

    // Flow field scale: tuned so currents are a few hundred px wide —
    // walkers meander within a current rather than snapping between them.
    const noiseScale = 0.004;

    // NE bias: pure noise drifts randomly; we bias the field toward
    // up-and-right so the crowd has net directional flow. 0 = pure noise,
    // 1 = all bias. 0.65 keeps visible turbulence while ensuring exit
    // through the top/right edges, not the left.
    const biasStrength = 0.65;
    const biasAngle = -Math.PI / 4; // NE in screen coords (y+ down)
    const biasDX = Math.cos(biasAngle) * biasStrength;
    const biasDY = Math.sin(biasAngle) * biasStrength;

    // Collision avoidance: uniform spatial hash. Cell size = repulsion
    // radius so each walker only checks its own cell + 8 neighbors.
    const REPEL_RADIUS = 14;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const CELL = REPEL_RADIUS;

    interface Walker {
      x: number;
      y: number;
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

    // Throttled spawn from a band just off-screen (bottom, extending left).
    // Gradual fill over the first ~5 seconds reads as a crowd entering the
    // frame. Once TARGET is reached, no more spawns — the asteroids wrap
    // takes over and the population cycles indefinitely.
    const SPAWN_PER_FRAME = 3;

    function spawn(): Walker {
      const quarter = map(rng(), 0, 1, 1.5, 4.5);
      return {
        x: map(rng(), 0, 1, -halfW - 40, halfW * 0.6),
        y: map(rng(), 0, 1, halfH + 20, halfH + 70),
        quarter,
        half: quarter * 2,
        limbLength: map(rng(), 0, 1, 22, 34),
        torsoWidthOffset: map(rng(), 0, 1, 1.5, quarter),
        torsoLength: map(rng(), 0, 1, 12, 22),
        neck: rng() * quarter,
        color: Math.floor(map(rng(), 0, 1, 140, 255)),
      };
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

        // Throttled initial fill. Once walkers.length >= TARGET, this is
        // a no-op and the population cycles via the wrap logic below.
        let spawnedThisFrame = 0;
        while (walkers.length < TARGET && spawnedThisFrame < SPAWN_PER_FRAME) {
          walkers.push(spawn());
          spawnedThisFrame++;
        }

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
          const n = noise(wk.x * noiseScale, wk.y * noiseScale);
          // Blend noise direction with NE bias vector. This keeps local
          // turbulence but guarantees net drift up-and-right.
          const noiseAngle = n * Math.PI * 2;
          const dx = Math.cos(noiseAngle) * (1 - biasStrength) + biasDX;
          const dy = Math.sin(noiseAngle) * (1 - biasStrength) + biasDY;
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
                  // Strength falls off linearly with distance.
                  const d = Math.sqrt(d2);
                  const s = (REPEL_RADIUS - d) / REPEL_RADIUS;
                  repelX += (ddx / d) * s;
                  repelY += (ddy / d) * s;
                }
              }
            }
          }

          const speed = 1.2;
          wk.x += Math.cos(angle) * speed + repelX * 0.6;
          wk.y += Math.sin(angle) * speed + repelY * 0.6;

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
