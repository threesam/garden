import type { Sketch } from "../types";

// 80x800 — horizontal outer rings (like a cell's outer membrane) with inner
// falling shapes (hemoglobin torus / mitochondria sphere). 3D → 2D elevation.
export const day13: Sketch = {
  slug: "13",
  title: "80x800",
  date: "2022-01-13",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;

    interface Outer {
      y: number;
      size: number;
      a: number;
    }
    const outerRings: Outer[] = [];
    for (let i = 0; i < 100; i++) {
      const y = map(i, 0, 100, (-h / 2) * 0.9, (h / 2) * 0.9);
      const size = h / 10 - map(noise(i * 0.08), 0, 1, 0, 30);
      const a = map(dist(0, y, 0, 0), h / 8, h / 2, 0, 50);
      outerRings.push({ y, size, a });
    }
    const smallestRingSize = Math.min(...outerRings.map((r) => r.size));

    interface Shape {
      x: number;
      y: number;
      ringR: number;
      tubeR: number;
      type: "hemoglobin" | "mitochondria";
      color: number;
      acc: number;
      force: number;
      rotation: number;
    }
    const innerShapes: Shape[] = [];

    return {
      tick(_, frame) {
        ctx.fillStyle = "rgb(245,240,232)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        // outer ellipses as horizontal rings
        for (const r of outerRings) {
          if (r.a <= 0) continue;
          ctx.strokeStyle = `rgba(26,26,20,${r.a / 50})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, r.y, r.size / 2, r.size / 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (frame % 4 === 0) {
          const type = rng() > 0.25 ? "hemoglobin" : "mitochondria";
          innerShapes.push({
            x: map(rng(), 0, 1, -smallestRingSize / 2 + 10, smallestRingSize / 2 - 10),
            y: -h / 2,
            ringR: map(rng(), 0, 1, 3, 7),
            tubeR: 1,
            type,
            color: map(rng(), 0, 1, 200, 255),
            acc: map(rng(), 0, 1, -0.5, 0.5),
            force: Math.floor(map(rng(), 0, 1, -3, 3)),
            rotation: 0,
          });
        }
        for (const s of innerShapes) {
          s.y += 1 + s.acc;
          s.rotation += s.force;
          if (s.y >= h / 2 - 1) continue;
          const alpha = map(dist(0, s.y, 0, 0), 0, h / 2, 0, 1);
          if (s.type === "mitochondria") {
            ctx.fillStyle = `rgba(255,255,255,${1 - Math.abs(alpha)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.ringR, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.strokeStyle = `rgba(${s.color},0,0,${1 - Math.abs(alpha)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.ringR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      },
    };
  },
};
