import type { Sketch } from "../types";

// The crowd — procedural stick figures walking along a flow field. Each
// figure has random proportions (size, torso, arm, leg, neck) established
// once; every frame it samples a noise-angle at its current position,
// steps forward, rotates to face the flow, and paints itself. The canvas
// doesn't clear, so trails of figures accumulate along the flow lines —
// the "crowd" trace over time.
export const day30: Sketch = {
  slug: "30",
  title: "the crowd",
  date: "2022-01-30",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallSide = Math.min(w, h) * 0.75;
    const multi = 0.002;
    const start = -smallSide * 0.5;
    const end = smallSide * 0.5;

    interface Walker {
      x: number;
      y: number;
      // fixed proportions
      quarter: number;
      half: number;
      limbLength: number;
      torsoWidthOffset: number;
      torsoLength: number;
      neck: number;
      color: number; // grey 0-255
      life: number;
    }

    const WALKER_COUNT = 220;
    const walkers: Walker[] = [];

    function spawn(): Walker {
      const quarter = map(rng(), 0, 1, 3, 10);
      return {
        x: map(rng(), 0, 1, start * 1.5, end * 1.5),
        y: map(rng(), 0, 1, start * 1.5, end * 1.5),
        quarter,
        half: quarter * 2,
        limbLength: map(rng(), 0, 1, 50, 70),
        torsoWidthOffset: map(rng(), 0, 1, 5, quarter),
        torsoLength: map(rng(), 0, 1, 30, 50),
        neck: rng() * quarter,
        color: Math.floor(map(rng(), 0, 1, 140, 255)),
        life: Math.floor(map(rng(), 0, 1, 60, 400)),
      };
    }
    for (let i = 0; i < WALKER_COUNT; i++) walkers.push(spawn());

    function drawWalker(w: Walker) {
      const q = w.quarter;
      const h2 = w.half;
      const torsoW = h2 - w.torsoWidthOffset;
      const tl = w.torsoLength;
      const ll = w.limbLength;
      const minPossible = 0.025;

      ctx.strokeStyle = `rgb(${w.color},${w.color},${w.color})`;
      ctx.lineWidth = 1;

      ctx.save();
      // head
      if (rng() > minPossible) ctx.strokeRect(0, -h2 - w.neck, h2, h2);
      // body
      if (rng() > minPossible) ctx.strokeRect(w.torsoWidthOffset / 2, 0, torsoW, tl);
      // arms — slight tilt
      const armTilt = rng() * (Math.PI / 90);
      ctx.rotate(armTilt);
      if (rng() > minPossible) ctx.strokeRect(h2, 0, q, ll * (1 + rng() * 0.3));
      ctx.rotate(-armTilt);
      if (rng() > minPossible) ctx.strokeRect(-q, 0, q, ll * (1 + rng() * 0.3));
      // legs — drop to below torso
      ctx.translate(0, tl);
      if (rng() > minPossible) ctx.strokeRect(q, 0, q, ll * (1 + rng() * 0.3));
      if (rng() > minPossible) ctx.strokeRect(0, 0, q, ll * (1 + rng() * 0.3));
      ctx.restore();
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);

    return {
      tick() {
        ctx.save();
        ctx.translate(w / 2, h / 2);

        for (const walker of walkers) {
          const angle = map(
            noise(walker.x * multi, walker.y * multi),
            0,
            1,
            0,
            Math.PI * 4
          );
          walker.x += Math.cos(angle) * 1.2;
          walker.y += Math.sin(angle) * 1.2;

          ctx.save();
          ctx.translate(walker.x, walker.y);
          // Face the flow — add +π/2 because the figure's "up" axis is its
          // torso-to-head direction; rotating it by the flow angle keeps
          // limbs trailing behind naturally.
          ctx.rotate(angle + Math.PI / 2);
          drawWalker(walker);
          ctx.restore();

          walker.life--;
          const offscreen =
            walker.x < -w / 1.5 ||
            walker.x > w / 1.5 ||
            walker.y < -h / 1.5 ||
            walker.y > h / 1.5;
          if (walker.life <= 0 || offscreen) {
            const fresh = spawn();
            Object.assign(walker, fresh);
          }
        }

        ctx.restore();
      },
    };
  },
};
