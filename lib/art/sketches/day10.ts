import type { Sketch } from "../types";

// Machine learning — a square boundary containing 500 scattered points;
// points outside the boundary colored red (misclassified).
export const day10: Sketch = {
  slug: "10",
  title: "machine learning",
  date: "2022-01-10",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const smallest = w > h ? h : w;
    const maxSize = smallest * 0.8;
    const increment = 10;
    const boundary = maxSize / 2;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 500; i++) {
      points.push({
        x: map(rng(), 0, 1, -boundary - increment * 2, boundary + increment),
        y: map(rng(), 0, 1, -boundary - increment * 2, boundary + increment),
      });
    }

    ctx.fillStyle = "rgb(26,26,20)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-boundary, -boundary, maxSize, maxSize);

    for (const p of points) {
      const outside = Math.abs(p.x) > boundary + 1 || Math.abs(p.y) > boundary + 1;
      ctx.fillStyle = outside ? "rgb(255,0,0)" : "rgb(255,255,255)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return {};
  },
};
