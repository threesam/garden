import type { Sketch } from "../types";

// Eye ocean — grid of cream circles with dark pupils, lightly displaced by
// noise. Originally rendered in WEBGL; here projected orthographically.
export const day25: Sketch = {
  slug: "25",
  title: "eye ocean",
  date: "2022-01-25",
  setup(api) {
    const { ctx, w, h, noise, map } = api;
    const padding = 0.75;
    const smallSide = Math.min(w, h) * padding;
    const multi = 0.025;
    const start = -smallSide * 4.5;
    const end = smallSide * 4.5;
    const density = 13;
    const space = smallSide / density;
    // Eye diameter is now a fraction of the cell spacing so there's
    // always visible gap between eyes regardless of viewport size.
    // Previously eyes were hardcoded in pixels (13–30) and overlapped
    // heavily at mobile because `space` shrinks with the viewport.
    const minSize = space * 0.3;
    const maxSize = space * 0.55;

    // rotateX(-PI/5), rotateY(PI/7), rotateZ(PI/30)
    const rx = -Math.PI / 5;
    const ry = Math.PI / 7;
    const rz = Math.PI / 30;
    const cX = Math.cos(rx),
      sX = Math.sin(rx);
    const cY = Math.cos(ry),
      sY = Math.sin(ry);
    const cZ = Math.cos(rz),
      sZ = Math.sin(rz);

    function project(x: number, y: number, z: number) {
      // X axis
      const y1 = y * cX - z * sX;
      let z1 = y * sX + z * cX;
      // Y axis
      const x1 = x * cY + z1 * sY;
      z1 = -x * sY + z1 * cY;
      // Z axis
      const xz = x1 * cZ - y1 * sZ;
      const yz = x1 * sZ + y1 * cZ;
      return { x: xz, y: yz, z: z1 };
    }

    interface Eye {
      px: number;
      py: number;
      pz: number;
      size: number;
      pupilDx: number;
      pupilDy: number;
      pupilSize: number;
    }

    const eyes: Eye[] = [];
    for (let y = start; y < end; y += space) {
      for (let x = start; x < end; x += space) {
        const size = map(y, start, end, minSize, maxSize);
        const move = map(y, start, end, -size / 3, size / 3);
        // Jitter + curve also scaled to `space` so they don't dominate
        // the cell on mobile.
        const shiftAmp = space * 0.12;
        const curveAmp = space * 0.4;
        const nShift = map(noise(x * multi, y * multi), 0, 1, -shiftAmp, shiftAmp);
        const curve = map(noise(x * multi, y * multi), 0, 1, -curveAmp, curveAmp);
        const p = project(x + nShift, y + nShift, curve);
        eyes.push({
          px: p.x,
          py: p.y,
          pz: p.z,
          size: size + nShift * 2,
          pupilDx: move,
          pupilDy: -move,
          pupilSize: Math.max(2, size / 3 - nShift),
        });
      }
    }

    eyes.sort((a, b) => a.pz - b.pz);

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w, h / 3);

    for (const e of eyes) {
      // sclera
      ctx.fillStyle = "rgb(255, 250, 200)";
      ctx.beginPath();
      ctx.arc(e.px, e.py, e.size / 2, 0, Math.PI * 2);
      ctx.fill();
      // pupil
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.beginPath();
      ctx.arc(e.px + e.pupilDx, e.py + e.pupilDy, e.pupilSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return {};
  },
};
