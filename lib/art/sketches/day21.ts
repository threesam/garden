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
      r: number; // line + head-dot radius
      life: number;
    }

    const PARTICLE_COUNT = 260;
    const particles: P[] = [];
    function spawn(): P {
      return {
        x: map(rng(), 0, 1, 0, w),
        y: map(rng(), 0, 1, 0, h),
        r: map(rng(), 0, 1, 1.2, 5),
        life: Math.floor(map(rng(), 0, 1, 60, 400)),
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
          const nx = p.x + Math.cos(angle) * 1.5;
          const ny = p.y + Math.sin(angle) * 1.5;

          const outside =
            Math.abs(nx - cx) > boundaryHalf || Math.abs(ny - cy) > boundaryHalf;
          const trailRGBA = outside
            ? "rgba(225, 40, 40, 0.55)"
            : "rgba(235, 230, 220, 0.35)";
          const headRGBA = outside
            ? "rgba(255, 80, 80, 0.95)"
            : "rgba(255, 255, 255, 0.95)";

          // trail stroke
          ctx.lineWidth = p.r;
          ctx.strokeStyle = trailRGBA;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // head dot
          ctx.fillStyle = headRGBA;
          ctx.beginPath();
          ctx.arc(nx, ny, p.r * 0.9, 0, Math.PI * 2);
          ctx.fill();

          p.x = nx;
          p.y = ny;
          p.life--;

          // Respawn when lifetime ends or escapes the frame — keeps the
          // composition evolving instead of settling into fixed channels.
          if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
            const fresh = spawn();
            p.x = fresh.x;
            p.y = fresh.y;
            p.r = fresh.r;
            p.life = fresh.life;
          }
        }
      },
    };
  },
};
