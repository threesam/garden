import type { Sketch } from "../types";

// Rings — 100 horizontally-offset ellipses whose heights form a cylindrical
// shape. Noise drives alpha.
export const day2: Sketch = {
  slug: "2",
  title: "rings",
  date: "2022-01-02",
  setup(api) {
    const { ctx, w, h, noise, map } = api;
    const isLandscape = w > h;
    const ringsAmount = 100;
    const MIN_SCREEN = 300;
    const MAX_SCREEN = 2000;
    const multi = map(w, MIN_SCREEN, MAX_SCREEN, 0.5, 5);
    const pad = 0.69;
    const diameter = (isLandscape ? h : w) * pad;

    ctx.fillStyle = "rgb(26,26,20)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (!isLandscape) ctx.rotate(Math.PI / 2);

    ctx.strokeStyle = "rgba(245,240,232,1)";
    for (let i = 0; i < ringsAmount; i++) {
      const a = map(noise(0.069 * i + 4), 0, 1, 0, 1);
      const cx = -multi * ringsAmount + i * 2 * multi;
      const ellW = diameter;
      const ellH = -diameter + map(i, 0, ringsAmount, 0, 2 * diameter);
      if (ellH === 0) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.ellipse(cx, 0, ellW / 2, Math.abs(ellH) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return {};
  },
};
