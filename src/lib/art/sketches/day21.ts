import type { Sketch } from "../types";

// day21 — Sapper-style flow field of circles. A capped pool of particles
// is shuffled, then revealed one per frame until the pool is full. Each
// active particle walks a curl-of-noise flow field (divergence-free, so
// they never pool in sinks), wraps at the canvas edges, and paints a
// circle at its new position every frame. Size + stroke alpha come from
// a second noise sample. Inside a central padded rectangle circles are
// white with faint black strokes; outside they flip to black circles
// with red strokes — the "fidenza + machine learning gone wrong" combo
// from the original Instagram post.
export const day21: Sketch = {
  slug: "21",
  title: "flow ml",
  date: "2022-01-21",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallSide = Math.min(w, h);
    // Sapper original ran ~10k particles which (a) tanked perf and (b)
    // packed the canvas so densely that pooling at flow-field sinks
    // looked like a frozen field. Cap at 2500 — still saturates the
    // composition while leaving headroom for the per-frame curl + draw.
    const MAX_PARTICLES = 2500;
    const density = 100;
    const padding = 0.7;
    const space = (smallSide / density) * padding;
    const left = w / 2 - (smallSide / 2) * padding;
    const right = w / 2 + (smallSide / 2) * padding;
    const bottom = h / 2 - (smallSide / 2) * padding;
    const top = h / 2 + (smallSide / 2) * padding;

    // Curl-of-noise (divergence-free) replaces the original's raw
    // noise-as-angle, which had convergent sinks where particles drained
    // and froze. ∂F_x/∂x + ∂F_y/∂y = 0 by construction so particles keep
    // circulating instead of pooling.
    const noiseScale = 0.004;
    const curlStep = 0.02;

    interface V {
      x: number;
      y: number;
    }
    const vectors: V[] = [];
    for (let x = left; x < right; x += space) {
      for (let y = bottom; y < top; y += space) {
        if (vectors.length >= MAX_PARTICLES) break;
        vectors.push({
          x: x + map(rng(), 0, 1, -space, space),
          y: y + map(rng(), 0, 1, -space, space),
        });
      }
      if (vectors.length >= MAX_PARTICLES) break;
    }
    // Fisher-Yates shuffle so the progressive reveal seeds randomly
    // across the grid instead of sweeping corner-to-corner.
    for (let i = vectors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [vectors[i], vectors[j]] = [vectors[j]!, vectors[i]!];
    }

    ctx.fillStyle = "rgb(26,26,20)";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;

    return {
      tick(_, frame) {
        const revealed = Math.min(frame + 1, vectors.length);
        for (let i = 0; i < revealed; i++) {
          const v = vectors[i]!;

          // Curl-of-noise: treat `noise` as a stream function ψ and take
          // its 2D curl — F = (∂ψ/∂y, -∂ψ/∂x) — via central differences.
          // Four lookups per particle, ~10k per frame at MAX, negligible.
          const nx = v.x * noiseScale;
          const ny = v.y * noiseScale;
          const dnx = (noise(nx + curlStep, ny) - noise(nx - curlStep, ny)) / (2 * curlStep);
          const dny = (noise(nx, ny + curlStep) - noise(nx, ny - curlStep)) / (2 * curlStep);
          const flowLen = Math.hypot(dny, -dnx) || 1;
          v.x += dny / flowLen;
          v.y += -dnx / flowLen;

          // Asteroids-wrap so particles circulate forever instead of
          // exiting the system — exit right → re-enter left, etc.
          if (v.x < 0) v.x += w;
          else if (v.x > w) v.x -= w;
          if (v.y < 0) v.y += h;
          else if (v.y > h) v.y -= h;

          const n = noise(v.x * 0.025, v.y * 0.025);
          const size = map(n, 0, 1, 1, 33);
          const isOutside =
            v.x < left || v.x > right || v.y > top || v.y < bottom;

          if (isOutside) {
            ctx.fillStyle = "rgb(26,26,20)";
            ctx.strokeStyle = "rgb(255,0,0)";
          } else {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.strokeStyle = `rgba(0,0,0,${1 - n})`;
          }

          ctx.beginPath();
          ctx.arc(v.x, v.y, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      },
    };
  },
};
