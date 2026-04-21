import type { Sketch } from "../types";

// Fingerprint planet (v1) — noise-driven flow field rendered as colored
// dots inside a bounded square, confined to a disk of radius smallSide/2.
export const day14: Sketch = {
  slug: "14",
  title: "fingerprint planet v1",
  date: "2022-01-14",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const smallSide = w > h ? h : w;
    const density = 200;
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
      r: number;
      g: number;
      b: number;
    }
    const vectors: V[] = [];
    for (let x = left; x < right; x += space) {
      for (let y = bottom; y < top; y += space) {
        vectors.push({
          x: x + map(rng(), 0, 1, -31, 31),
          y: y + map(rng(), 0, 1, -31, 31),
          r: Math.floor(rng() * 255),
          g: Math.floor(rng() * 255),
          b: Math.floor(rng() * 255),
        });
      }
    }
    // shuffle
    for (let i = vectors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [vectors[i], vectors[j]] = [vectors[j], vectors[i]];
    }

    ctx.fillStyle = "rgb(245,240,232)";
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
          const insideDisk = distFromCenter <= (smallSide / 2) * padding;
          if (!insideDisk) continue;
          ctx.strokeStyle = `rgba(${v.r},${v.g},${v.b},0.12)`;
          ctx.beginPath();
          ctx.moveTo(v.x + map(rng(), 0, 1, -1, 1), v.y + map(rng(), 0, 1, -1, 1));
          ctx.lineTo(v.x, v.y);
          ctx.stroke();
        }
      },
    };
  },
};
