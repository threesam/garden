import type { Sketch } from "../types";

// Flow field — particles follow a noise-angled vector field, drawing short
// semi-transparent strokes. Animated with progressive reveal.
export const day4: Sketch = {
  slug: "4",
  title: "flow field",
  date: "2022-01-04",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const multi = 0.0027;
    const density = 69;
    const space = w / density;

    interface V {
      x: number;
      y: number;
    }
    const vectors: V[] = [];
    for (let x = 0; x < w; x += space) {
      for (let y = 0; y < h; y += space) {
        vectors.push({
          x: x + map(rng(), 0, 1, -31, 31),
          y: y + map(rng(), 0, 1, -31, 31),
        });
      }
    }
    // shuffle
    for (let i = vectors.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [vectors[i], vectors[j]] = [vectors[j], vectors[i]];
    }

    ctx.fillStyle = "rgb(26,26,20)";
    ctx.fillRect(0, 0, w, h);

    return {
      tick(_, frame) {
        const max = Math.min(frame + 1, vectors.length);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < max; i++) {
          const v = vectors[i];
          const angle = map(noise(v.x * multi, v.y * multi), 0, 1, 0, Math.PI * 4);
          v.x += Math.cos(angle);
          v.y += Math.sin(angle);
          const halfLength = 5;
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(v.x + halfLength, v.y - halfLength);
          ctx.stroke();
        }
      },
    };
  },
};
