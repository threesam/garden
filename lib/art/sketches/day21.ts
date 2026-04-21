import type { Sketch } from "../types";

// Fingerprint planet v2 — dense noise-sized white circles drifting along a
// noise-angled flow field, progressively revealed.
export const day21: Sketch = {
  slug: "21",
  title: "fingerprint planet v2",
  date: "2022-01-21",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const smallSide = w > h ? h : w;
    const density = 500;
    const padding = 0.7;
    const space = (smallSide / density) * padding;
    const left = w / 2 - (smallSide / 2) * padding;
    const right = w / 2 + (smallSide / 2) * padding;
    const bottom = h / 2 - (smallSide / 2) * padding;
    const top = h / 2 + (smallSide / 2) * padding;
    const multi = 0.004;

    const vectors: { x: number; y: number }[] = [];
    for (let x = left; x < right; x += space) {
      for (let y = bottom; y < top; y += space) {
        vectors.push({ x: x + map(rng(), 0, 1, -space, space), y: y + map(rng(), 0, 1, -space, space) });
      }
    }
    for (let i = vectors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [vectors[i], vectors[j]] = [vectors[j], vectors[i]];
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);

    return {
      tick(_, frame) {
        const max = Math.min(frame + 1, vectors.length);
        for (let i = 0; i < max; i++) {
          const v = vectors[i];
          const angle = map(noise(v.x * multi, v.y * multi), 0, 1, 0, Math.PI * 4);
          v.x += Math.cos(angle);
          v.y += Math.sin(angle);
          const distFromCenter = dist(w / 2, h / 2, v.x, v.y);
          const n = noise(v.x * 0.025, v.y * 0.025);
          const alpha = map(n, 0, 1, 0, 1);
          const size = map(n, 0, 1, 1, 33);
          const isOutsideSquare = v.x < left || v.x > right || v.y > top || v.y < bottom;
          const isOutsideCircle = distFromCenter > (smallSide / 2) * padding;
          if (isOutsideSquare) {
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.strokeStyle = "rgb(255,0,0)";
          } else if (isOutsideCircle) {
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
          } else {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
          }
          ctx.beginPath();
          ctx.arc(v.x, v.y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
  },
};
