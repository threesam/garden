import type { Sketch } from "../types";

// Arrow scatter — arrows walking along a noise-angled flow field. Each
// arrow rotates to face its direction of travel; the canvas clears every
// frame so there is no trail — you just see the moving field of arrows.
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

    interface Arrow {
      x: number;
      y: number;
      stroke: number; // per-arrow grey
      life: number;
    }

    const ARROW_COUNT = 3000;
    const arrows: Arrow[] = [];
    function spawn(): Arrow {
      return {
        x: map(rng(), 0, 1, start * 2, end * 2),
        y: map(rng(), 0, 1, start * 2, end * 2),
        stroke: Math.floor(map(rng(), 0, 1, 120, 255)),
        life: Math.floor(map(rng(), 0, 1, 120, 600)),
      };
    }
    for (let i = 0; i < ARROW_COUNT; i++) arrows.push(spawn());

    return {
      tick() {
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.lineWidth = 1;

        for (const a of arrows) {
          const angle = map(noise(a.x * multi, a.y * multi), 0, 1, 0, Math.PI * 2);
          a.x += Math.cos(angle) * 1.2;
          a.y += Math.sin(angle) * 1.2;

          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.rotate(angle);
          ctx.strokeStyle = `rgb(${a.stroke},${a.stroke},${a.stroke})`;
          ctx.beginPath();
          // arrow glyph: shaft + two head strokes, 30px long
          ctx.moveTo(0, 0);
          ctx.lineTo(30, 0);
          ctx.moveTo(15, 0);
          ctx.lineTo(10, 10);
          ctx.moveTo(15, 0);
          ctx.lineTo(10, -10);
          ctx.stroke();
          ctx.restore();

          a.life--;
          const offscreen =
            a.x < start * 2.2 || a.x > end * 2.2 || a.y < start * 2.2 || a.y > end * 2.2;
          if (a.life <= 0 || offscreen) {
            const fresh = spawn();
            a.x = fresh.x;
            a.y = fresh.y;
            a.stroke = fresh.stroke;
            a.life = fresh.life;
          }
        }

        ctx.restore();
      },
    };
  },
};
