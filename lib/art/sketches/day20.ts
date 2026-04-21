import type { Sketch } from "../types";

// Sea of shapes — grid of circles that breathe via nested sine waves,
// colored by a noise field biased blue-green.
export const day20: Sketch = {
  slug: "20",
  title: "sea of shapes",
  date: "2022-01-20",
  setup(api) {
    const { ctx, w, h, noise, map } = api;
    const padding = 0.75;
    const smallSide = (w > h ? h : w) * padding;
    const multi = 0.025;
    const start = -smallSide * 0.4;
    const end = smallSide * 0.4;
    const density = 50;
    const space = smallSide / density;

    interface Point {
      x: number;
      y: number;
      size: number;
      g: number;
      b: number;
      a: number;
    }

    const points: Point[] = [];
    for (let x = start; x < end; x += space) {
      for (let y = start; y < end; y += space) {
        const n = noise(x * multi, y * multi);
        points.push({
          x,
          y,
          size: Math.floor(map(n, 0, 1, space * 0.69, space * 1.5)),
          g: Math.floor(map(n, 0, 1, 100, 200)),
          b: Math.floor(map(n, 0, 1, 130, 255)),
          a: Math.floor(map(y, start, end, 255, 10)),
        });
      }
    }

    return {
      tick(_, frame) {
        const offset = frame / 13;
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        for (const p of points) {
          const waveX = map(p.x, start, end, 10, 0);
          const waveY = map(p.y, start, end, 10, 0);
          ctx.fillStyle = `rgba(0, ${p.g}, ${p.b}, ${p.a / 255})`;
          ctx.strokeStyle = `rgba(0,0,0,${p.a / 255})`;
          ctx.beginPath();
          ctx.arc(
            p.x + Math.sin(p.y * 0.41 + offset) * waveX,
            p.y + Math.sin(p.x * 0.41 + offset) * waveY,
            Math.max(1, (p.size + Math.sin((p.x + p.y) * 0.41 + offset) * waveX) / 2),
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      },
    };
  },
};
