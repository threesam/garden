import type { Sketch } from "../types";

// Abstract forest — recursively-branching L-system-ish trees scattered
// randomly across the whole canvas. Size is purely a function of a
// low-frequency "flow" noise field: closer to the flow = larger tree.
export const day23: Sketch = {
  slug: "23",
  title: "abstract plants",
  date: "2022-01-23",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const multi = 0.05;
    // Very-low-frequency noise for the flow field: ~2–3 cycles across the
    // viewport so zones are large enough to read as "river" vs "dry" at a
    // glance, not as a fine-grained texture.
    const flowMulti = 0.003;
    const maxLength = 25;
    const minLength = 7;
    const angle = (30 * Math.PI) / 180;
    const minScale = 0.25;
    const maxScale = 1.3;
    // Smoothstep edges stretch mid-range flow values toward the extremes —
    // otherwise raw value noise sits around 0.5 most places and the big-vs-
    // small gap ends up invisible.
    const flowLo = 0.3;
    const flowHi = 0.7;
    // Jittered grid: compute a square-ish grid from density, then offset
    // each tree by up to ~half a cell in each axis. Guarantees even
    // coverage (no big gaps or clumps from random sampling) while
    // breaking up the visible grid regularity.
    const density = 0.00045;
    const target = Math.max(1, Math.round(w * h * density));
    const cols = Math.max(1, Math.round(Math.sqrt(target * (w / h))));
    const rows = Math.max(1, Math.round(target / cols));
    const cellW = w / cols;
    const cellH = h / rows;
    const jitter = 0.45; // fraction of cell size

    // Smoothstep: 0 below lo, 1 above hi, smooth S-curve in between.
    function smoothstep(lo: number, hi: number, x: number): number {
      const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
      return t * t * (3 - 2 * t);
    }

    interface Tree {
      x: number;
      y: number;
      scale: number;
      color: number;
    }
    const trees: Tree[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -w / 2 + cellW * (c + 0.5);
        const cy = -h / 2 + cellH * (r + 0.5);
        const x = cx + map(rng(), 0, 1, -cellW * jitter, cellW * jitter);
        const y = cy + map(rng(), 0, 1, -cellH * jitter, cellH * jitter);
        const n = noise(x * multi, y * multi);
        const rawFlow = noise(x * flowMulti, y * flowMulti);
        const flow = smoothstep(flowLo, flowHi, rawFlow);
        trees.push({
          x,
          y,
          scale: map(flow, 0, 1, minScale, maxScale),
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
      ctx.save();
      ctx.strokeStyle = `rgb(${Math.floor(t.color)},${Math.floor(t.color)},${Math.floor(t.color)})`;
      ctx.translate(t.x, t.y);
      branch(maxLength * t.scale);
      ctx.restore();
    }
    ctx.restore();
    return {};
  },
};
