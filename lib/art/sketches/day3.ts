import type { Sketch } from "../types";

// Triangle space — 500 expanding triangles rotated by noise, each outlined
// with alpha drawn from noise.
export const day3: Sketch = {
  slug: "3",
  title: "triangle space",
  date: "2022-01-03",
  setup(api) {
    const { ctx, w, h, noise, map } = api;

    ctx.fillStyle = "rgb(245,240,232)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const triangles: { alpha: number; coords: [number, number, number, number, number, number] }[] = [];
    for (let i = 0; i < 500; i++) {
      const shift = map(noise(i * 0.01), 0, 1, 5, 15);
      const alpha = map(noise(i * 0.01), 0, 1, 100, 255);
      triangles.push({
        alpha,
        coords: [-i * shift, -i * shift * 0.5, i * shift, -i * shift * 0.5, 0, i * shift],
      });
    }

    triangles.slice(1).reverse().forEach((t, i) => {
      const rot = map(noise(i * 0.01), 0, 1, Math.PI / 5, Math.PI);
      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(26,26,20,${t.alpha / 255})`;
      ctx.beginPath();
      ctx.moveTo(t.coords[0], t.coords[1]);
      ctx.lineTo(t.coords[2], t.coords[3]);
      ctx.lineTo(t.coords[4], t.coords[5]);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    return {};
  },
};
