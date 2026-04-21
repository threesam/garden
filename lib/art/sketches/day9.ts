import type { Sketch } from "../types";

// Architecture — stacked cylinders + dome on top, with a gate of block
// slabs. Originally 3D WEBGL; here rendered as a flat iconographic elevation
// — faithful to the silhouette, not the 3D rotation.
export const day9: Sketch = {
  slug: "9",
  title: "architecture",
  date: "2022-01-09",
  setup(api) {
    const { ctx, w, h } = api;
    ctx.fillStyle = "rgb(245,240,232)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const slab = 20;
    ctx.strokeStyle = "rgb(26,26,20)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgb(245,240,232)";

    // 5 stacked cylinder slabs (drawn as ellipse caps + side rects)
    const cylR = 100;
    for (let i = 0; i < 5; i++) {
      const y = -i * slab;
      ctx.fillRect(-cylR, y - slab, cylR * 2, slab);
      ctx.strokeRect(-cylR, y - slab, cylR * 2, slab);
      ctx.beginPath();
      ctx.ellipse(0, y - slab, cylR, slab / 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // sphere top
    ctx.beginPath();
    ctx.arc(0, -5 * slab, 99, Math.PI, 0);
    ctx.stroke();
    ctx.fill();

    // door gate: left + right slab stacks
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 4; y++) {
        ctx.strokeRect(-30 - slab + y * slab, slab + x * slab, slab, slab);
        ctx.strokeRect(30 - slab + y * slab, slab + x * slab, slab, slab);
      }
    }
    // lintel — thin arch between two stacks
    ctx.beginPath();
    ctx.arc(0, slab, 40, Math.PI, 0);
    ctx.stroke();

    // door's negative space
    ctx.fillStyle = "rgb(26,26,20)";
    ctx.beginPath();
    ctx.rect(-20, slab, 40, 60);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, slab, 20, Math.PI, 0);
    ctx.fill();

    ctx.restore();
    return {};
  },
};
