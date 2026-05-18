import type { Sketch } from "../types";

// Shape packing — circles grow until they collide with an edge or another
// circle; mirrored horizontally for symmetry. Animated as new seeds are added
// each frame until a kill threshold stops growth.
export const day12: Sketch = {
  slug: "12",
  title: "packing",
  date: "2022-01-12",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const smallerSide = Math.min(w, h);
    const KILL_MAX = 10000;

    interface Shape {
      x: number;
      y: number;
      r: number;
      weight: number;
      alpha: number;
    }

    const circles: Shape[] = [];
    let kills = 0;
    let stopped = false;

    function detectEdgeCollision(s: Shape): boolean {
      return s.x - s.r <= 0 || s.x + s.r >= w || s.y - s.r <= 0 || s.y + s.r >= h;
    }

    function detectShapeCollision(s: Shape): boolean {
      for (const other of circles) {
        if (other === s) continue;
        const d = dist(s.x, s.y, other.x, other.y);
        if (d <= s.r + other.r) {
          if (s.r === 1) {
            circles.pop();
            kills++;
          }
          return true;
        }
      }
      return false;
    }

    function drawShape(s: Shape) {
      if (s.alpha <= 10 || s.x - w / 2 <= 50) return;
      ctx.strokeStyle = `rgba(0, 0, 0, ${s.alpha / 255})`;
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.lineWidth = s.weight;
      const distFromCenter = s.x - w / 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r - s.weight / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s.x - distFromCenter * 2, s.y, s.r - s.weight / 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Paint solid red background once; subsequent frames only paint new shapes.
    ctx.fillStyle = "rgb(200, 0, 0)";
    ctx.fillRect(0, 0, w, h);

    return {
      tick() {
        if (stopped) return;
        if (kills > KILL_MAX) {
          stopped = true;
          return;
        }

        const x = rng() * w;
        const y = rng() * h;
        const s: Shape = {
          x,
          y,
          r: 1,
          weight: Math.max(1, Math.floor(map(noise(x * 0.0069), 0, 1, 4, 1))),
          alpha: Math.floor(map(dist(x, y, w / 2, h / 2), 0, (smallerSide / 2) * 0.9, 255, 0)),
        };
        circles.push(s);

        for (const candidate of circles) {
          if (detectEdgeCollision(candidate)) {
            drawShape(candidate);
          } else if (detectShapeCollision(candidate)) {
            if (candidate.r > 13) drawShape(candidate);
          } else {
            candidate.r++;
            drawShape(candidate);
          }
        }
      },
    };
  },
};
