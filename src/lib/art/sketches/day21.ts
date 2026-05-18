import type { Sketch } from "../types";

// day21 — faithful port of the Sapper original: a jittered grid of particles
// is shuffled, then revealed one per frame. Each active particle walks a
// noise-angled flow field and paints a *circle* (not a line) at its new
// position every frame. Size + stroke alpha come from a second noise
// sample. Inside a central padded rectangle circles are white with faint
// black strokes; outside they flip to black circles with red strokes — the
// "fidenza + machine learning gone wrong" combo described in the original
// Instagram post.
export const day21: Sketch = {
  slug: "21",
  title: "flow ml",
  date: "2022-01-21",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallSide = Math.min(w, h);
    // Density dialed down from the Sapper original's 500 (which produced
    // ~250k particles at a 1080p viewport — unnecessary) to 100, which
    // still saturates the composition nicely at ~10k particles.
    const density = 100;
    const padding = 0.7;
    const space = (smallSide / density) * padding;
    const left = w / 2 - (smallSide / 2) * padding;
    const right = w / 2 + (smallSide / 2) * padding;
    const bottom = h / 2 - (smallSide / 2) * padding;
    const top = h / 2 + (smallSide / 2) * padding;
    const multi = 0.004;

    interface V {
      x: number;
      y: number;
    }
    const vectors: V[] = [];
    for (let x = left; x < right; x += space) {
      for (let y = bottom; y < top; y += space) {
        vectors.push({
          x: x + map(rng(), 0, 1, -space, space),
          y: y + map(rng(), 0, 1, -space, space),
        });
      }
    }
    // Fisher-Yates shuffle so the progressive reveal seeds randomly across
    // the grid instead of sweeping corner-to-corner.
    for (let i = vectors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [vectors[i], vectors[j]] = [vectors[j], vectors[i]];
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;

    return {
      tick(_, frame) {
        const max = Math.min(frame + 1, vectors.length);
        for (let i = 0; i < max; i++) {
          const v = vectors[i];
          // The original treats the noise value as "an angle in 0-720" and
          // passes it straight to Math.cos/sin, which interpret it as
          // radians. Keeping that literal — it produces more chaotic
          // direction churn than a clean 0-2π mapping, which is what the
          // aesthetic depends on.
          const angle = map(noise(v.x * multi, v.y * multi), 0, 1, 0, 720);
          v.x += Math.cos(angle);
          v.y += Math.sin(angle);

          const n = noise(v.x * 0.025, v.y * 0.025);
          const size = map(n, 0, 1, 1, 33);
          const isOutside =
            v.x < left || v.x > right || v.y > top || v.y < bottom;

          if (isOutside) {
            ctx.fillStyle = "rgb(0,0,0)";
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
