import type { Sketch } from "../types";

// Fingerprint planet — 3D point field rendered via manual orthographic
// projection; rotated -22.5° on X and +45° on Y like the original.
export const day15: Sketch = {
  slug: "15",
  title: "fingerprint planet",
  date: "2022-01-15",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const padding = 0.5;
    const smallSide = Math.min(w, h) * padding;
    const multi = 0.0069;
    const start = -smallSide / 2;
    const end = smallSide / 2;

    interface P {
      x: number;
      y: number;
      z: number;
      color: number;
      alpha: number;
    }
    const points: P[] = [];
    for (let x = start; x < end; x += 10) {
      for (let y = start; y < end; y += 100) {
        for (let z = start; z < end; z += 10) {
          const n = noise(x * multi + smallSide, y * multi + smallSide, z * multi + smallSide);
          const color = map(n, 0, 1, 0, 255);
          if (color <= 0) continue;
          const alpha = map(y, start, end, 69, 255);
          const jitter = y < end - 100 && rng() > 0.999 ? map(rng(), 0, 1, 25, 75) : 0;
          points.push({ x, y: y + jitter, z, color, alpha });
        }
      }
    }

    // Rotation matrices for rotateX(-22.5°) then rotateY(45°)
    const rx = -Math.PI / 8; // ≈ -22.5°
    const ry = Math.PI / 4; // 45°
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // sort back-to-front by projected z
    const projected = points.map((p) => {
      // rotX
      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;
      // rotY
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;
      return { x: x2, y: y1, z: z2, color: p.color, alpha: p.alpha };
    });
    projected.sort((a, b) => a.z - b.z);

    for (const p of projected) {
      ctx.fillStyle = `rgba(${p.color}, ${p.color}, ${p.color}, ${p.alpha / 255})`;
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }
    ctx.restore();
    return {};
  },
};
