import type { Sketch } from "../types";

// Abstract plants — a grove of recursively-branching L-system-ish trees,
// scaled smaller as they're planted further from center.
export const day23: Sketch = {
  slug: "23",
  title: "abstract plants",
  date: "2022-01-23",
  setup(api) {
    const { ctx, w, h, rng, noise, map, dist } = api;
    const smallSide = w > h ? h : w;
    const multi = 0.05;
    const start = -smallSide / 2;
    const end = smallSide / 2;
    const density = 10;
    const space = smallSide / density;
    const maxLength = 25;
    const minLength = 7;
    const angle = (30 * Math.PI) / 180;
    // Planting disc radius — extended from 0.28 to 0.45 * smallSide so the
    // fade trails further out before dying at the edges.
    const discRadius = smallSide * 0.45;
    // Center trees get a 30% size boost so center-vs-edge contrast reads
    // more drastic.
    const centerScale = 1.3;
    const edgeScale = 0.25;

    interface Tree {
      x: number;
      y: number;
      color: number;
    }
    const trees: Tree[] = [];
    for (let x = start + space; x < end; x += space) {
      for (let y = start + space; y < end; y += space) {
        if (dist(x, y, 0, 0) >= discRadius) continue;
        const n = noise(x * multi, y * multi);
        trees.push({
          x: x + map(rng(), 0, 1, -10, 10),
          y: y + map(rng(), 0, 1, -10, 10),
          color: map(n, 0, 1, 100, 255),
        });
      }
    }

    function branch(len: number) {
      if (len <= minLength) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.beginPath();
        ctx.ellipse(0, 0, (10 + map(rng(), 0, 1, -5, 5)) / 2, len / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const offset = map(rng(), 0, 1, -5, 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(offset, -len);
      ctx.stroke();
      ctx.save();
      ctx.translate(offset, -len);
      ctx.rotate(angle);
      branch(len * map(rng(), 0, 1, 0.69, 0.8));
      ctx.rotate(-angle * 2);
      branch(len * map(rng(), 0, 1, 0.69, 0.8));
      ctx.restore();
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2 + maxLength);
    ctx.lineWidth = 1;
    for (const t of trees) {
      const d = dist(t.x, t.y, 0, 0);
      const scale = map(d, 0, discRadius, centerScale, edgeScale);
      ctx.save();
      ctx.strokeStyle = `rgb(${Math.floor(t.color)},${Math.floor(t.color)},${Math.floor(t.color)})`;
      ctx.translate(t.x, t.y);
      branch(maxLength * scale);
      ctx.restore();
    }
    ctx.restore();
    return {};
  },
};
