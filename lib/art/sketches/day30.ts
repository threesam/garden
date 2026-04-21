import type { Sketch } from "../types";

// The crowd — procedural stick figures walking along a gentle NE-biased
// flow field. Spawn just below the bottom-right edge (off-screen),
// stream up-and-right across the frame, pop off once they leave the
// viewport. Each walker's proportions (size, torso, arm/leg/neck) are
// fixed at spawn and maintained for its lifetime. Short fading trail so
// recent paths remain faintly visible.
export const day30: Sketch = {
  slug: "30",
  title: "the crowd",
  date: "2022-01-30",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;

    // Looser, less-curvy flow: smaller `multi` means the noise varies
    // over a much larger spatial scale, so nearby walkers follow nearly
    // parallel headings.
    const noiseScale = 0.0008;

    // NE-biased flow: base angle -π/4 (up + right) plus noise-driven
    // ±π/6 wobble. Walkers stay broadly streaming together instead of
    // pinwheeling.
    const baseAngle = -Math.PI / 4;
    const wobble = Math.PI / 6;

    interface Walker {
      x: number;
      y: number;
      // proportions — set once at spawn, immutable thereafter
      quarter: number;
      half: number;
      limbLength: number;
      torsoWidthOffset: number;
      torsoLength: number;
      neck: number;
      color: number;
    }

    const walkers: Walker[] = [];
    const TARGET = 700;

    function spawn(): Walker {
      // Smaller figures overall — quarter 1.5-4.5 (was 3-10) so the
      // total glyph footprint is roughly half.
      const quarter = map(rng(), 0, 1, 1.5, 4.5);
      return {
        // Spawn just below the bottom-right quadrant, outside the frame.
        // y > h/2 = below the visible bottom in world coords (origin at
        // canvas center after translate(w/2, h/2)).
        x: map(rng(), 0, 1, -w * 0.1, w * 0.55),
        y: map(rng(), 0, 1, h * 0.5 + 20, h * 0.5 + 260),
        quarter,
        half: quarter * 2,
        limbLength: map(rng(), 0, 1, 22, 34),
        torsoWidthOffset: map(rng(), 0, 1, 1.5, quarter),
        torsoLength: map(rng(), 0, 1, 12, 22),
        neck: rng() * quarter,
        color: Math.floor(map(rng(), 0, 1, 140, 255)),
      };
    }

    function drawWalker(wk: Walker) {
      const q = wk.quarter;
      const h2 = wk.half;
      const torsoW = h2 - wk.torsoWidthOffset;
      const tl = wk.torsoLength;
      const ll = wk.limbLength;
      const minPossible = 0.025;

      ctx.strokeStyle = `rgb(${wk.color},${wk.color},${wk.color})`;
      ctx.lineWidth = 1;

      ctx.save();
      // Draw calls are deterministic per-figure (no per-frame randomness)
      // so the same walker looks consistent as it moves. We reuse rng()
      // intentionally to vary which limbs appear per frame — keeps figures
      // jittery like the original static version.
      if (rng() > minPossible) ctx.strokeRect(0, -h2 - wk.neck, h2, h2);
      if (rng() > minPossible) ctx.strokeRect(wk.torsoWidthOffset / 2, 0, torsoW, tl);
      const armTilt = rng() * (Math.PI / 90);
      ctx.rotate(armTilt);
      if (rng() > minPossible) ctx.strokeRect(h2, 0, q, ll * (1 + rng() * 0.3));
      ctx.rotate(-armTilt);
      if (rng() > minPossible) ctx.strokeRect(-q, 0, q, ll * (1 + rng() * 0.3));
      ctx.translate(0, tl);
      if (rng() > minPossible) ctx.strokeRect(q, 0, q, ll * (1 + rng() * 0.3));
      if (rng() > minPossible) ctx.strokeRect(0, 0, q, ll * (1 + rng() * 0.3));
      ctx.restore();
    }

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);

    const halfW = w / 2;
    const halfH = h / 2;
    const MARGIN = 80;

    return {
      tick() {
        // Short-trail fade: ~18% per frame — imprints are visibly gone
        // within ~15 frames so the sketch reads as streaming motion, not
        // accumulation.
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, 0, w, h);

        // Top up to target — spawn until density is maintained. Using a
        // while loop so a rapid burst of exits refills promptly.
        while (walkers.length < TARGET) walkers.push(spawn());

        ctx.save();
        ctx.translate(halfW, halfH);

        // Iterate backwards so splice doesn't skip elements.
        for (let i = walkers.length - 1; i >= 0; i--) {
          const wk = walkers[i];
          const n = noise(wk.x * noiseScale, wk.y * noiseScale);
          const angle = baseAngle + map(n, 0, 1, -wobble, wobble);
          wk.x += Math.cos(angle) * 1.2;
          wk.y += Math.sin(angle) * 1.2;

          const offscreen =
            wk.y < -halfH - MARGIN ||
            wk.x > halfW + MARGIN ||
            wk.x < -halfW - MARGIN;
          if (offscreen) {
            // Pop and release — O(1) swap-remove so we don't shift the
            // whole tail each time a walker exits.
            walkers[i] = walkers[walkers.length - 1];
            walkers.pop();
            continue;
          }

          ctx.save();
          ctx.translate(wk.x, wk.y);
          ctx.rotate(angle + Math.PI / 2); // face direction of travel
          drawWalker(wk);
          ctx.restore();
        }

        ctx.restore();
      },
    };
  },
};
