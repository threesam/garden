import type { Sketch } from "../types";

// Square field — grid of square cells whose sizes + alpha are noise-driven
// and biased toward one corner.
export const day5: Sketch = {
  slug: "5",
  title: "square field",
  date: "2022-01-05",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const halfTotal = w > 768 ? 300 : 150;
    const increment = 25;
    const multi = 0.1;

    interface V {
      x: number;
      y: number;
      size: number;
    }
    const vectors: V[] = [];
    for (let x = -halfTotal; x < halfTotal; x += increment) {
      for (let y = -halfTotal; y < halfTotal; y += increment) {
        const scaledX = map(x, 0, halfTotal, 1, 1.1);
        const scaledY = map(y, 0, -halfTotal, 1, 1.1);
        const average = (scaledX + scaledY) / 2;
        const mult = map(rng(), 0, 1, 1, 4);

        let vx = x;
        let vy = y;
        if (x >= halfTotal - increment * mult && y <= increment * mult - halfTotal) {
          vx = x * average + map(rng(), 0, 1, -2, 2 * average);
          vy = y * average + map(rng(), 0, 1, -2, 2 * average);
        }
        const size = map(noise(x * multi, y * multi), 0, 1, 0, increment);
        vectors.push({ x: vx, y: vy, size });
      }
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    for (const v of vectors) {
      const scaledX = map(v.x, 0, halfTotal * 1.3, 255, 0);
      const scaledY = map(v.y, 0, -halfTotal * 1.3, 255, 0);
      const alpha = Math.floor(scaledY + scaledX / 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, alpha / 255))})`;
      ctx.fillRect(v.x, v.y, increment - v.size, increment - v.size);
    }
    ctx.restore();
    return {};
  },
};
