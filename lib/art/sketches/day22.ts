import type { Sketch } from "../types";

// Time — a visualization of the current date/time: seconds grid, minutes
// fill, hours as concentric squares, day as diagonal lines, year as dots.
// Animates once per second.
export const day22: Sketch = {
  slug: "22",
  title: "time",
  date: "2022-01-22",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const padding = 0.69;
    const smallSide = (w > h ? h : w) * padding;
    const spacing = (smallSide / 60) * 0.4 * 2;
    const start = -smallSide * 0.4;
    const end = smallSide * 0.4;

    const vectors: { x: number; y: number; color: number }[] = [];
    for (let x = start; x < end; x += spacing) {
      for (let y = start; y < end; y += spacing) {
        const n = noise(x * 0.025, y * 0.025);
        vectors.push({ x, y, color: map(n, 0, 1, 50, 150) });
      }
    }

    const lines: [number, number, number, number][] = [];
    const increment = smallSide / padding / Math.sqrt(365);
    for (let x = -smallSide / 2 / padding; x < smallSide / 2 / padding - increment; x += increment) {
      for (let y = -smallSide / 2 / padding; y < smallSide / 2 / padding; y += increment) {
        if (rng() > 0.5) lines.push([x, y, x + increment, y + increment]);
        else lines.push([x, y + increment, x + increment, y]);
      }
    }

    const points: { x: number; y: number }[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < currentYear; i++) {
      points.push({
        x: map(rng(), 0, 1, -smallSide / 2 / padding, smallSide / 2 / padding),
        y: map(rng(), 0, 1, -smallSide / 2 / padding, smallSide / 2 / padding),
      });
    }

    let lastSecond = -1;
    return {
      tick() {
        const now = new Date();
        const sec = now.getSeconds();
        if (sec === lastSecond) return;
        lastSecond = sec;
        const time = {
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: sec,
        };

        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        // year dots
        ctx.lineWidth = 1;
        for (const p of points) {
          const outOfBounds =
            p.x < -smallSide / 2 || p.x > smallSide / 2 || p.y < -smallSide / 2 || p.y > smallSide / 2;
          ctx.fillStyle = outOfBounds ? "rgb(255,255,0)" : "rgb(125,125,0)";
          ctx.fillRect(p.x, p.y, 2, 2);
        }

        // day lines
        const yearPad = Math.floor(time.hour * spacing);
        lines.slice(0, time.day).forEach((line) => {
          const anyOut =
            line[0] < -smallSide * 0.4 - yearPad ||
            line[0] > smallSide * 0.4 + yearPad ||
            line[1] < -smallSide * 0.4 - yearPad ||
            line[1] > smallSide * 0.4 + yearPad ||
            line[2] < -smallSide * 0.4 - yearPad ||
            line[2] > smallSide * 0.4 + yearPad ||
            line[3] < -smallSide * 0.4 - yearPad ||
            line[3] > smallSide * 0.4 + yearPad;
          ctx.strokeStyle = anyOut ? "rgb(255,255,255)" : "rgb(50,50,50)";
          ctx.beginPath();
          ctx.moveTo(line[0], line[1]);
          ctx.lineTo(line[2], line[3]);
          ctx.stroke();
        });

        // second/minute grid
        for (const v of vectors) {
          const secondSpace = map(v.x, start, end, 1, 60);
          const minuteSpace = map(v.y, start, end, 60, 1);
          if (time.minute >= minuteSpace) {
            ctx.fillStyle = `rgb(${Math.floor(v.color)},${Math.floor(v.color)},${Math.floor(v.color)})`;
            ctx.fillRect(v.x + spacing / 4, v.y + spacing / 4, spacing / 2, spacing / 2);
          } else if (time.second >= secondSpace) {
            ctx.fillStyle = "rgb(250,250,250)";
            ctx.fillRect(v.x + spacing / 4, v.y + spacing / 4, spacing / 2, spacing / 2);
          }
        }

        // hour rings
        ctx.lineWidth = 2;
        for (let hour = 0; hour < time.hour; hour++) {
          const color = map(hour, 0, time.hour, 150, 100);
          const pad = Math.floor(hour * spacing) + spacing * 2;
          ctx.strokeStyle = `rgb(${Math.floor(color)},${Math.floor(color / 2)},0)`;
          ctx.strokeRect(
            -(smallSide * 0.8 + pad) / 2,
            -(smallSide * 0.8 + pad) / 2,
            smallSide * 0.8 + pad,
            smallSide * 0.8 + pad
          );
        }

        ctx.restore();
      },
    };
  },
};
