import type { Sketch } from "../types";

// Tiny humans — 1300 procedural stick figures scattered and rotated by noise.
// Single-frame (static).
export const day30: Sketch = {
  slug: "30",
  title: "the crowd",
  date: "2022-01-30",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallSide = Math.min(w, h) * 0.75;
    const multi = 0.0005;
    const start = -smallSide * 0.5;
    const end = smallSide * 0.5;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.lineWidth = 1;

    function rect(x: number, y: number, wi: number, he: number) {
      ctx.strokeRect(x, y, wi, he);
    }

    function makeHuman(x: number, y: number) {
      const quarter = map(rng(), 0, 1, 3, 10);
      const half = quarter * 2;
      const limbLength = map(rng(), 0, 1, 50, 70);
      const minPossible = 0.025;
      const torsoWidthOffset = map(rng(), 0, 1, 5, quarter);
      const torsoLength = map(rng(), 0, 1, 30, 50);
      const neck = rng() * quarter;
      ctx.save();
      const g = Math.floor(rng() * 255);
      ctx.strokeStyle = `rgb(${g},${g},${g})`;
      if (rng() > minPossible) rect(x, y - half - neck, half, half); // head
      if (rng() > minPossible) rect(x + torsoWidthOffset / 2, y, half - torsoWidthOffset, torsoLength); // body
      const angle = rng() * (Math.PI / 90);
      ctx.rotate(angle);
      if (rng() > minPossible) rect(x + half, y, quarter, limbLength * (1 + rng() * 0.3)); // arm R
      ctx.rotate(-angle);
      if (rng() > minPossible) rect(x - quarter, y, quarter, limbLength * (1 + rng() * 0.3)); // arm L
      ctx.translate(0, torsoLength);
      if (rng() > minPossible) rect(x + quarter, y, quarter, limbLength * (1 + rng() * 0.3)); // leg R
      if (rng() > minPossible) rect(x, y, quarter, limbLength * (1 + rng() * 0.3)); // leg L
      ctx.restore();
    }

    const bounds = 2;
    for (let plane = 0; plane < 1300; plane++) {
      const x = map(rng(), 0, 1, start * bounds, end * bounds);
      const y = map(rng(), 0, 1, start * bounds, end * bounds);
      const n = noise(x * multi, y * multi);
      const rotation = map(n, 0, 1, 0, Math.PI * 2);

      ctx.save();
      ctx.rotate(rotation);
      makeHuman(x, y);
      ctx.restore();
    }
    ctx.restore();
    return {};
  },
};
