import type { Sketch } from "../types";

// Negative space — 3D field of "flower" line bursts. Each flower is N radial
// lines rotated around its point. Rotated -22.5° on Z overall.
export const day31: Sketch = {
  slug: "31",
  title: "negative space",
  date: "2022-01-31",
  setup(api) {
    const { ctx, w, h, rng, map } = api;
    // Padding bumped 0.5 -> 0.85 so the burst fills more of the canvas
    // — at 0.5 it sat as a small ball in the middle with lots of empty
    // gray around it.
    const padding = 0.85;
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
          // Dark bursts on a light field. Flat near-black across the
          // depth range — the prior 0→180 distance ramp pushed outer
          // flowers so close to the bg (180 vs the 216 fill) that the
          // edges read as white-on-gray instead of "dark spike circle"
          // silhouette the reference shows.
          const color = 20;
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

    // Light cool-gray backdrop sampled from the reference (~#d8d8d8) —
    // lighter than the prior #c0c0c0 so the black spikes pop more.
    ctx.fillStyle = "rgb(216,216,216)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    // 1.5 px so the strokes don't sub-pixel-thin into invisibility on
    // high-DPR canvases (where 1 px maps to ~0.33 device px and the
    // antialiasing washes the line out).
    ctx.lineWidth = 1.5;

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
