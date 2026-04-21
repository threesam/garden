import type { Sketch } from "../types";

// Palette squares — a grid of rotating colored squares displaced by distance-from-
// center sine/cosine waves. Uses the Genuary 28 palette.
export const day27: Sketch = {
  slug: "27",
  title: "palette squares",
  date: "2022-01-27",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const palette = ["#2E294E", "#541388", "#F1E9DA", "#FFD400", "#D90368"];
    const padding = 1;
    const smallSide = Math.min(w, h) * padding;
    const multi = 0.025;
    const start = -smallSide * 0.4;
    const end = smallSide * 0.4;
    const density = 50;
    const space = smallSide / density;

    interface Tile {
      x: number;
      y: number;
      size: number;
      color: string;
      a: number;
    }

    const tiles: Tile[] = [];
    for (let x = start; x < end; x += space) {
      for (let y = start; y < end; y += space) {
        if (dist(x, y, 0, 0) >= end) continue;
        const n = noise(x * multi, y * multi);
        tiles.push({
          x,
          y,
          size: Math.floor(map(n, 0, 1, space * 0.69, space * 1.5)),
          color: palette[Math.floor(rng() * palette.length)],
          a: Math.floor(map(y, start, end, 255, 10)),
        });
      }
    }

    return {
      tick(_, frame) {
        const offset = frame / 60;
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        for (const t of tiles) {
          const fromCenter = dist(t.x, t.y, 0, 0);
          const waveX = map(fromCenter, 0, smallSide / 2, 31, 0);
          const xoff = Math.cos(-fromCenter + offset) * -waveX;
          ctx.fillStyle = t.color;
          ctx.globalAlpha = t.a / 255;
          ctx.strokeStyle = "rgba(0,0,0,1)";
          ctx.lineWidth = 1;
          const s = t.size + xoff;
          ctx.fillRect(t.x - xoff, t.y - xoff, s, s);
          ctx.strokeRect(t.x - xoff, t.y - xoff, s, s);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      },
    };
  },
};
