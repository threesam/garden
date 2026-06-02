import type { Sketch } from "../types";

// Sol Lewitt 118 — lines connecting every pair of points, with alpha pulsing
// by a per-point sine wave. Animated.
export const day7: Sketch = {
  slug: "7",
  title: "sol lewitt 118",
  date: "2022-01-07",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const smallSide = w > h ? h : w;
    const halfTotal = (smallSide / 2) * 0.9;
    const increment = 20;

    const vectors: { x: number; y: number }[] = [];
    for (let i = 0; i < halfTotal; i += increment) {
      vectors.push({
        x: map(rng(), 0, 1, -halfTotal, halfTotal),
        y: map(rng(), 0, 1, -halfTotal, halfTotal),
      });
    }

    return {
      tick(_, frame) {
        ctx.fillStyle = "rgb(26,26,20)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        ctx.lineWidth = 0.5;
        vectors.forEach((v, i) => {
          const count = Math.sin(frame * 0.0069 + i);
          const r = Math.floor(map(v.x, -halfTotal, halfTotal, 100, 0));
          const g = Math.floor(map(v.y, -halfTotal, halfTotal, 100, 255));
          const b = Math.floor(map(v.x, -halfTotal, halfTotal, 100, 255));
          const a = map(count, 0, 1, 0, 1);
          ctx.strokeStyle = `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
          for (const other of vectors) {
            ctx.beginPath();
            ctx.moveTo(count * v.x, count * v.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
        ctx.restore();
      },
    };
  },
};
