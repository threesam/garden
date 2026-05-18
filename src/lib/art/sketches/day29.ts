import type { Sketch } from "../types";

// 3D box cloud — orthographic projection of a sphere of small boxes, colored
// by noise, alpha by distance from center. Back-to-front painter.
export const day29: Sketch = {
  slug: "29",
  title: "cube cloud",
  date: "2022-01-29",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const padding = 0.5;
    const smallSide = Math.min(w, h) * padding;
    const multi = 0.0069;
    const start = -smallSide / 2;
    const end = smallSide / 2;
    const density = 25;
    const space = smallSide / density;

    interface Box {
      x: number;
      y: number;
      z: number;
      color: number;
      alpha: number;
      size: number;
    }

    const boxes: Box[] = [];
    for (let x = start; x < end; x += space) {
      for (let y = start; y < end; y += space) {
        for (let z = start; z < end; z += space) {
          const d = Math.hypot(x, y, z);
          if (d >= 300) continue;
          const n = noise(x * multi + smallSide, y * multi + smallSide, z * multi + smallSide);
          boxes.push({
            x: x + map(rng(), 0, 1, -10, 10),
            y: y + map(rng(), 0, 1, -10, 10),
            z: z + map(rng(), 0, 1, -10, 10),
            color: map(n, 0, 1, 0, 255),
            alpha: map(d, 0, 200, 255, 0),
            size: space + map(rng(), 0, 1, -13, 13),
          });
        }
      }
    }

    const rx = -Math.PI / 8;
    const ry = Math.PI / 4;
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);

    const projected = boxes
      .map((b) => {
        const y1 = b.y * cosX - b.z * sinX;
        const z1 = b.y * sinX + b.z * cosX;
        const x2 = b.x * cosY + z1 * sinY;
        const z2 = -b.x * sinY + z1 * cosY;
        return { ...b, px: x2, py: y1, pz: z2 };
      })
      .sort((a, b) => a.pz - b.pz);

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    // avoid `dist` lint unused
    void dist;
    for (const b of projected) {
      ctx.fillStyle = `rgba(${b.color},${b.color},${b.color},${b.alpha / 255})`;
      ctx.strokeStyle = `rgba(${255 - b.color},${255 - b.color},${255 - b.color},${b.alpha / 255})`;
      ctx.fillRect(b.px - b.size / 2, b.py - b.size / 2, b.size, b.size);
      ctx.strokeRect(b.px - b.size / 2, b.py - b.size / 2, b.size, b.size);
    }
    ctx.restore();
    return {};
  },
};
