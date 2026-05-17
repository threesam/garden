import type { Sketch } from "../types";

// Gradients — a dense cloud of pixels colored by position-noise or linear
// gradient based on a stochastic toss per cell. Static.
export const day16: Sketch = {
  slug: "16",
  title: "gradients",
  date: "2022-01-16",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const padding = 0.5;
    const smallSide = (w > h ? h : w) * padding;
    const start = -smallSide / 2;
    const end = smallSide / 2;
    const increment = 3;
    const multi = 0.1;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    for (let x = start; x < end; x += increment) {
      for (let y = start; y < end; y += increment) {
        const scaler = map(y, start, end, 0, 1);
        let r: number, g: number, b: number;
        if (rng() > scaler) {
          r = 0;
          g = map(x, start, end, 100, 50);
          b = map(y, start, end, 100, 50);
        } else {
          const n = noise(x * multi, y * multi);
          const color = map(n * n, 0, 1, 0, 200);
          r = color;
          g = 0;
          b = color;
        }
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        ctx.fillRect(x, y, increment, increment);
      }
    }
    ctx.restore();
    return {};
  },
};
