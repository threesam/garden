import type { Sketch } from "../types";

// Arrow scatter — noise-driven rotation renders thousands of tiny arrow-like
// glyphs across the canvas, with brightness from the noise field.
export const day26: Sketch = {
  slug: "26",
  title: "arrow scatter",
  date: "2022-01-26",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const padding = 0.75;
    const smallSide = (w > h ? h : w) * padding;
    const multi = 0.0005;
    const start = -smallSide * 0.5;
    const end = smallSide * 0.5;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const bounds = 2;
    for (let i = 0; i < 13000; i++) {
      const x = map(rng(), 0, 1, start * bounds, end * bounds);
      const y = map(rng(), 0, 1, start * bounds, end * bounds);
      const n = noise(x * multi, y * multi);
      const rotation = map(n, 0, 1, 0, Math.PI * 2);
      const stroke = Math.floor(rng() * 255);

      ctx.save();
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgb(${stroke},${stroke},${stroke})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30, y);
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x + 10, y + 10);
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x + 10, y - 10);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    return {};
  },
};
