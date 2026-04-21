import type { Sketch } from "../types";

// Flow × ML (day4 + day10 mash-up) — particles flow along a noise field
// leaving cumulative trails. Inside the central square they read as
// cream/white "organic" worms; outside the square they turn red
// ("machine learning gone wrong"). Head dots appear at each step's leading
// end and are what give the composition its beaded look.
export const day21: Sketch = {
  slug: "21",
  title: "flow ml",
  date: "2022-01-21",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallSide = Math.min(w, h);
    const boundaryHalf = smallSide * 0.35;
    const cx = w / 2;
    const cy = h / 2;
    const multi = 0.004;

    interface P {
      x: number;
      y: number;
      trailW: number; // line thickness
      headR: number; // head dot radius (distinct from trail to read as "ball")
      life: number;
    }

    const PARTICLE_COUNT = 90;
    const particles: P[] = [];
    function spawn(): P {
      const trailW = map(rng(), 0, 1, 0.8, 2.5);
      return {
        x: map(rng(), 0, 1, 0, w),
        y: map(rng(), 0, 1, 0, h),
        trailW,
        // Head dot is 3-4× the trail width so you can actually see the ball
        // moving instead of it disappearing into its own path.
        headR: trailW * map(rng(), 0, 1, 3, 5),
        life: Math.floor(map(rng(), 0, 1, 120, 600)),
      };
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn());

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = "round";

    return {
      tick() {
        for (const p of particles) {
          const angle = map(noise(p.x * multi, p.y * multi), 0, 1, 0, Math.PI * 4);
          const nx = p.x + Math.cos(angle) * 1.8;
          const ny = p.y + Math.sin(angle) * 1.8;

          const outside =
            Math.abs(nx - cx) > boundaryHalf || Math.abs(ny - cy) > boundaryHalf;
          const trailRGBA = outside
            ? "rgba(225, 40, 40, 0.7)"
            : "rgba(235, 230, 220, 0.5)";
          const headRGBA = outside ? "rgb(255, 60, 60)" : "rgb(255, 255, 255)";

          // trail stroke — thin
          ctx.lineWidth = p.trailW;
          ctx.strokeStyle = trailRGBA;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // head dot — thick, opaque, distinct from trail
          ctx.fillStyle = headRGBA;
          ctx.beginPath();
          ctx.arc(nx, ny, p.headR, 0, Math.PI * 2);
          ctx.fill();

          p.x = nx;
          p.y = ny;
          p.life--;

          if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
            const fresh = spawn();
            p.x = fresh.x;
            p.y = fresh.y;
            p.trailW = fresh.trailW;
            p.headR = fresh.headR;
            p.life = fresh.life;
          }
        }
      },
    };
  },
};
