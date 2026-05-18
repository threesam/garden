import type { Sketch } from "../types";

// Crescent — a white disk with an offset dark disk overlaid (moon/crescent),
// surrounded by diagonal sun-ray lines emanating outward.
export const day8: Sketch = {
  slug: "8",
  title: "crescent",
  date: "2022-01-08",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const smallSide = w > h ? h : w;
    const half = (smallSide / 2) * 0.5;
    const increment = 10;

    interface Ray {
      x: number;
      y: number;
      x2: number;
      y2: number;
    }
    const rays: Ray[] = [];
    for (let x = -half; x < half; x += increment) {
      const angle = map(x, -half, half, 0, Math.PI);
      const sin = Math.sin(angle) * 155;
      for (let i = Math.floor(Math.abs(x) / 10); i < Math.floor(half / 10); i++) {
        const damp = map(i, Math.abs(x) / 10, half, 0, half - Math.abs(x));
        const thing = map(rng(), 0, 1, 0, damp * 1.5);
        rays.push({
          x: x - sin + map(rng(), 0, 1, -damp, increment),
          y: x + sin - map(rng(), 0, 1, -damp, increment),
          x2: x - sin + map(rng(), 0, 1, -damp, increment) + thing,
          y2: x + sin - map(rng(), 0, 1, -damp, increment) - thing,
        });
      }
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(Math.PI / 4);

    rays.forEach((r) => {
      ctx.strokeStyle = "rgb(255,255,255)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgb(30,30,30)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(0, 0);
      ctx.stroke();
    });

    ctx.fillStyle = "rgb(255,255,255)";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.beginPath();
    ctx.arc(4, -4, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return {};
  },
};
