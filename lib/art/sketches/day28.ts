import type { Sketch } from "../types";

// Sea of tiles — original used a self.png grid; here substituted with filled
// rectangles in palette colors animated via distance-from-center waves.
export const day28: Sketch = {
  slug: "28",
  title: "sea of tiles",
  date: "2022-01-28",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const palette = ["#2E294E", "#541388", "#F1E9DA", "#FFD400", "#D90368"];
    const padding = 1;
    const smallSide = Math.min(w, h) * padding;
    const multi = 0.025;
    const start = -smallSide * 0.4;
    const end = smallSide * 0.4;
    const density = 20;
    const space = smallSide / density;

    interface Tile {
      x: number;
      y: number;
      size: number;
      color: string;
      a: number;
    }

    const tiles: Tile[] = [];
    for (let x = -w / 2; x < w / 2; x += space) {
      for (let y = -h / 2; y < h / 2; y += space * 1.25) {
        const n = noise(x * multi, y * multi);
        tiles.push({
          x,
          y,
          size: Math.floor(map(n, 0, 1, space * 0.69, space * 1.3)),
          color: palette[Math.floor(rng() * palette.length)],
          a: Math.floor(map(y, start, end, 255, 10)),
        });
      }
    }

    return {
      tick(_, frame) {
        const offset = frame / 60;
        ctx.fillStyle = "rgb(31,31,31)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        tiles.forEach((t, i) => {
          const fromCenter = dist(t.x, t.y, 0, 0);
          const waveX = map(fromCenter, 0, smallSide / 2, 31, 0);
          const xoff = Math.cos(-fromCenter + offset) * -waveX;
          const width = t.x < end ? 2 * space - t.size : t.size;
          const height = width - Math.sin(frame / 13 + i * 2);
          ctx.fillStyle = t.color;
          ctx.globalAlpha = t.a / 255;
          ctx.fillRect(t.x - xoff, t.y - xoff, width, height);
        });
        ctx.globalAlpha = 1;
        ctx.restore();
      },
    };
  },
};
