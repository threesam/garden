import type { Sketch } from "../types";

// Moonsea — scatter of translucent blue circles with one cream highlight.
export const day1: Sketch = {
  slug: "1",
  title: "moonsea",
  date: "2022-01-01",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const isLandscape = w > h;
    const maxR = (isLandscape ? h : w) / 3;
    const pixels = isLandscape ? h : w;
    const count = Math.floor(pixels > 500 ? pixels / 2 : pixels / 4);

    ctx.fillStyle = "rgb(245,240,232)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const circles: { x: number; y: number; d: number; blue: number; a: number }[] = [];
    for (let i = 0; i < count; i++) {
      circles.push({
        x: map(rng(), 0, 1, -maxR, maxR),
        y: map(rng(), 0, 1, -maxR, maxR),
        d: map(rng(), 0, 1, 13, 69),
        blue: Math.floor(map(rng(), 0, 1, 200, 255)),
        a: map(rng(), 0, 1, 50, 100),
      });
    }
    const uniqueIdx = circles.length - Math.floor(circles.length / 5);

    circles.forEach((c, i) => {
      if (i === uniqueIdx) {
        ctx.fillStyle = "rgb(26,26,20)";
      } else {
        ctx.fillStyle = `rgba(0, 0, ${c.blue}, ${c.a / 255})`;
      }
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.d / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return {};
  },
};
