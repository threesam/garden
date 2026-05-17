import type { Sketch } from "../types";

// Shell packing — shape packing where each filled circle is a radial line burst.
// Green-on-black organic look. Animated (new seeds added up to a kill threshold).
export const day32: Sketch = {
  slug: "32",
  title: "shell packing",
  date: "2022-02-01",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const smallerSide = Math.min(w, h);
    const multi = 0.69;

    interface Shape {
      x: number;
      y: number;
      r: number;
      rotation: number;
      big: number;
      small: number;
    }

    const circles: Shape[] = [];
    let kills = 0;
    let stopped = false;
    const KILL_MAX = 10000;

    function detectEdgeCollision(s: Shape): boolean {
      return (
        Math.abs(s.x) - s.r <= -smallerSide / 2 ||
        Math.abs(s.x) + s.r >= smallerSide / 2 ||
        Math.abs(s.y) - s.r <= -smallerSide / 2 ||
        Math.abs(s.y) + s.r >= smallerSide / 2
      );
    }

    function detectShapeCollision(s: Shape): boolean {
      for (const other of circles) {
        if (other === s) continue;
        const d = Math.hypot(s.x - other.x, s.y - other.y);
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
      ctx.save();
      ctx.translate(w / 2 + s.x, h / 2 + s.y);
      ctx.rotate(s.rotation);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgb(${s.big}, ${s.big - s.small}, 0)`;
      // 200-line radial fan
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI;
        const offset = (i / 200) * 10;
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, s.r - offset);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Initial dark green fill
    ctx.fillStyle = "rgb(0,10,0)";
    ctx.fillRect(0, 0, w, h);

    return {
      tick(_, frame) {
        if (stopped) return;
        if (kills > KILL_MAX) {
          stopped = true;
          return;
        }

        const x = map(rng(), 0, 1, -smallerSide / 2, smallerSide / 2);
        const y = map(rng(), 0, 1, -smallerSide / 2, smallerSide / 2);

        if (Math.hypot(x, y) < smallerSide / 2.5 && (frame > 1000 || frame % 7 === 0)) {
          const small = Math.floor(map(noise(x * multi), 0, 1, 0, 50));
          const big = Math.floor(map(noise(x * multi, y * multi), 0, 1, 150, 250));
          circles.push({
            x,
            y,
            r: 1,
            rotation: map(noise(x * multi, y * multi), 0, 1, 0, Math.PI),
            big,
            small,
          });
        }

        for (const c of circles) {
          if (detectEdgeCollision(c)) {
            drawShape(c);
          } else if (detectShapeCollision(c)) {
            if (c.r > 1) drawShape(c);
          } else {
            c.r++;
            drawShape(c);
          }
        }
      },
    };
  },
};
