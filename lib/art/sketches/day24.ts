import type { Sketch } from "../types";

// 69420 — tens of thousands of random colored circles + rectangles scattered
// across a bounded area. Pure chaos, single-frame.
export const day24: Sketch = {
  slug: "24",
  title: "69420",
  date: "2022-01-24",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const padding = 0.69;
    const smallSide = (w > h ? h : w) * padding;
    const start = -smallSide / 2;
    const end = smallSide / 2;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // 20k instead of the original 69420 — visually saturates well at this scale
    // and stays inside the per-sketch perf budget.
    const COUNT = 20000;
    for (let i = 0; i < COUNT; i++) {
      const x = map(rng(), 0, 1, start, end);
      const y = map(rng(), 0, 1, start, end);
      const wi = Math.ceil(map(rng(), 0, 1, 0, 20));
      const he = Math.ceil(map(rng(), 0, 1, 0, 20));
      const r = Math.ceil(map(rng(), 0, 1, 0, 255));
      const g = Math.ceil(map(rng(), 0, 1, 0, 255));
      const b = Math.ceil(map(rng(), 0, 1, 0, 255));
      const type = Math.ceil(map(rng(), 0, 1, 0, 2));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      if (type === 1) {
        ctx.beginPath();
        ctx.ellipse(x, y, wi / 2, he / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - wi / 2, y - he / 2, wi, he);
      }
    }
    ctx.restore();
    return {};
  },
};
