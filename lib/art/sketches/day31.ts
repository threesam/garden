import type { Sketch } from "../types";

// Negative space — 3D field of "flower" line bursts. Each flower is N radial
// lines rotated around its point. Rotated -22.5° on Z overall.
export const day31: Sketch = {
  slug: "31",
  title: "negative space",
  date: "2022-01-31",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    const padding = 0.5;
    const smallSide = Math.min(w, h) * padding;
    const start = -smallSide / 2;
    const end = smallSide / 2;
    const density = 13;
    const space = smallSide / density;

    interface Flower {
      x: number;
      y: number;
      z: number;
      color: number;
      petals: number;
    }

    const flowers: Flower[] = [];
    for (let x = start; x < end; x += space) {
      for (let y = start; y < end; y += space) {
        for (let z = start; z < end; z += space) {
          const d = Math.hypot(x, y, z);
          if (d <= 0) continue;
          const color = map(d, 0, end, 255, 100);
          const size = map(rng(), 0, 1, 0, space);
          flowers.push({
            x: x + map(rng(), 0, 1, -10, 10),
            y: y + map(rng(), 0, 1, -10, 10),
            z: z + map(rng(), 0, 1, -10, 10),
            color,
            petals: size,
          });
        }
      }
    }

    // rotateZ(-22.5°)
    const rz = -Math.PI / 8;
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);

    const projected = flowers
      .map((f) => ({
        ...f,
        px: f.x * cosZ - f.y * sinZ,
        py: f.x * sinZ + f.y * cosZ,
      }))
      .sort((a, b) => a.z - b.z);

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.lineWidth = 1;

    for (const f of projected) {
      if (f.petals < 2) continue;
      ctx.save();
      ctx.translate(f.px, f.py);
      ctx.strokeStyle = `rgb(${Math.floor(f.color)},${Math.floor(f.color)},${Math.floor(f.color)})`;
      const petals = Math.max(3, Math.floor(f.petals));
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 100);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
    return {};
  },
};
