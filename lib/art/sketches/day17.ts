import type { Sketch } from "../types";

// 3 colors — 3D grid of box outlines inside a sphere, colored from a
// 3-color palette. Rotating. Projected ortho to 2D.
export const day17: Sketch = {
  slug: "17",
  title: "3 colors",
  date: "2022-01-17",
  setup(api) {
    const { ctx, w, h, rng, map, dist } = api;
    const palette = [
      [254, 109, 115],
      [23, 195, 178],
      [255, 203, 119],
    ];
    const padding = 0.75;
    const smallSide = (w > h ? h : w) * padding;
    const start = -smallSide / 2;
    const end = smallSide / 2;
    const density = 13;
    const space = smallSide / density;

    interface B {
      x: number;
      y: number;
      z: number;
      bw: number;
      bh: number;
      color: [number, number, number];
    }
    const boxes: B[] = [];
    for (let x = start; x < end; x += space) {
      for (let y = start; y < end; y += space) {
        for (let z = start; z < end; z += space) {
          if (dist(x, y, z, 0) >= smallSide / 2) continue;
          void 0; // no-op, avoids unused var lint
          boxes.push({
            x: x + map(rng(), 0, 1, -10, 10),
            y: y + map(rng(), 0, 1, -10, 10),
            z: z + map(rng(), 0, 1, -10, 10),
            bw: map(rng(), 0, 1, 0, space / 2),
            bh: map(rng(), 0, 1, 0, space / 2),
            color: palette[Math.floor(rng() * palette.length)] as [number, number, number],
          });
        }
      }
    }

    const rxBase = -Math.PI / 16; // -11.25°

    return {
      tick(_, frame) {
        const rxVal = rxBase;
        const ry = Math.PI / 16 + (frame / 4) * (Math.PI / 180);
        const cX = Math.cos(rxVal),
          sX = Math.sin(rxVal);
        const cY = Math.cos(ry),
          sY = Math.sin(ry);

        ctx.fillStyle = "rgb(26,26,20)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        const proj = boxes
          .map((b) => {
            const y1 = b.y * cX - b.z * sX;
            const z1 = b.y * sX + b.z * cX;
            const x2 = b.x * cY + z1 * sY;
            const z2 = -b.x * sY + z1 * cY;
            return { ...b, px: x2, py: y1, pz: z2 };
          })
          .sort((a, b) => a.pz - b.pz);

        for (const b of proj) {
          ctx.strokeStyle = `rgb(${b.color[0]},${b.color[1]},${b.color[2]})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(b.px - b.bw / 2, b.py - b.bh / 2, b.bw, b.bh);
        }
        ctx.restore();
      },
    };
  },
};
