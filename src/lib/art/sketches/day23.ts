import type { Sketch } from "../types";

// Abstract forest — recursively-branching L-system-ish trees packed across
// the canvas: one tree per circle of a circle-packing layout (see below), the
// base length sized to the circle, so canopies fill the screen at varied sizes
// without overlapping their neighbors.
export const day23: Sketch = {
  slug: "23",
  title: "abstract plants",
  date: "2022-01-23",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const multi = 0.05;
    const minLength = 7;
    const angle = (30 * Math.PI) / 180;

    // Circle packing: drop circles at random points, each grown as large as it
    // fits without overlapping an existing circle or the canvas edge. Big
    // circles where there's room, small ones filling the gaps — an organic,
    // gap-free distribution. A tree then fills each circle, so the trees vary
    // in size and never overlap.
    const minR = Math.max(6, Math.min(w, h) * 0.007);
    const maxR = Math.min(w, h) * 0.05;
    const attempts = 15000;

    interface Circle {
      x: number;
      y: number;
      r: number;
    }
    const circles: Circle[] = [];
    for (let i = 0; i < attempts; i++) {
      const px = rng() * w;
      const py = rng() * h;
      let fit = Math.min(px, py, w - px, h - py, maxR);
      for (const c of circles) {
        const gap = Math.hypot(px - c.x, py - c.y) - c.r;
        if (gap < fit) fit = gap;
        if (fit < minR) break;
      }
      if (fit >= minR) circles.push({ x: px, y: py, r: fit });
    }

    interface Tree {
      x: number;
      y: number;
      len: number;
      color: number;
    }
    // Base sits at the circle's bottom; the canopy grows up to fill it. Length
    // is sized so a tree (~3x its base tall) spans the circle's diameter.
    const trees: Tree[] = circles.map((c) => {
      const n = noise(c.x * multi, c.y * multi);
      return {
        x: c.x - w / 2,
        y: c.y + c.r - h / 2,
        len: c.r * 0.72,
        color: map(n, 0, 1, 100, 255),
      };
    });

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

    ctx.fillStyle = "rgb(26,26,20)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.lineWidth = 1;
    for (const t of trees) {
      ctx.save();
      ctx.strokeStyle = `rgb(${Math.floor(t.color)},${Math.floor(t.color)},${Math.floor(t.color)})`;
      ctx.translate(t.x, t.y);
      branch(t.len);
      ctx.restore();
    }
    ctx.restore();
    return {};
  },
};
