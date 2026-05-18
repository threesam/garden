import type { Sketch } from "../types";

// Where my friends at — grid of yellow smileys with a cursor-driven
// spotlight. Hover reveals nearby friends; those outside the spotlight
// fade toward near-invisible.
export const day6: Sketch = {
  slug: "6",
  title: "friends",
  date: "2022-01-06",
  setup(api, canvas) {
    const { ctx, w, h, rng, map, dist } = api;
    const isLandscape = w > h;
    const increment = 50;

    interface F {
      x: number;
      y: number;
      size: number;
      lx: number;
      rx: number;
      ey: number;
      lSize: number;
      rSize: number;
    }
    const friends: F[] = [];
    for (let x = increment / 4; x < w; x += increment) {
      for (let y = increment / 4; y < h; y += increment) {
        const size = map(rng(), 0, 1, increment * 0.6, increment) + map(rng(), 0, 1, -3, 3);
        friends.push({
          x,
          y,
          size,
          lx: x - size / 5,
          rx: x + size / 5,
          ey: y - size / 6,
          lSize: map(rng(), 0, 1, size / 13, size / 7),
          rSize: map(rng(), 0, 1, size / 13, size / 7),
        });
      }
    }

    const smallSide = isLandscape ? h : w;
    const spotlight = smallSide * 0.6;
    // Track cursor in CSS-pixel space of the canvas. Default to center so
    // the first frame isn't blank, and fall back to center on pointerleave.
    let mx = w / 2;
    let my = h / 2;

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    }
    function onLeave() {
      mx = w / 2;
      my = h / 2;
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    function render() {
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, 0, w, h);

      for (const f of friends) {
        const d = dist(mx, my, f.x, f.y);
        const r = Math.floor(map(f.x, 0, w, 200, 255));
        const a = Math.max(0.15, map(d, 0, spotlight, 1, 0.15));
        const eyeMulti = Math.max(0.5, map(d, 0, spotlight, 2, 0.5));

        ctx.fillStyle = `rgba(${r}, ${r}, 0, ${a})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.beginPath();
        ctx.arc(f.lx, f.ey, (f.lSize * eyeMulti) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.rx, f.ey, (f.rSize * eyeMulti) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.lineWidth = 3;
        const halfLine = map(d, spotlight, 0, f.size / 5, f.size / 15);
        ctx.beginPath();
        ctx.moveTo(f.x - halfLine, f.y + halfLine);
        ctx.lineTo(f.x + halfLine, f.y + halfLine);
        ctx.stroke();
      }
    }

    render(); // first paint

    return {
      tick: render,
      cleanup() {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      },
    };
  },
};
