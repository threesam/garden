import type { Sketch } from "../types";

// VHS — a gray tv-noise rectangle with scanlines and a "<< REWIND" label.
export const day18: Sketch = {
  slug: "18",
  title: "vhs",
  date: "2022-01-18",
  setup(api) {
    const { ctx, w, h, rng, noise, map } = api;
    const padding = 0.75;
    const smallSide = (w > h ? h : w) * padding;
    const startX = w / 2 - smallSide / 2;
    const endX = w / 2 + smallSide / 2;
    const startY = h / 2 - ((smallSide / 2) * 3) / 4;
    const endY = h / 2 + ((smallSide / 2) * 3) / 4;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgb(200,200,200)";
    ctx.strokeStyle = "rgb(200,200,200)";
    ctx.fillRect(startX - 1, startY - 1, smallSide + 2, (smallSide * 3) / 4 + 2);

    // noise pixels
    const imgW = Math.floor(endX - startX);
    const imgH = Math.floor(endY - startY);
    const imgData = ctx.getImageData(Math.floor(startX), Math.floor(startY), imgW, imgH);
    const data = imgData.data;
    const multi = 0.25;
    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {
        const color = Math.floor(map(noise(x * multi * multi, y * multi), 0, 1, 0, 120));
        const i = (y * imgW + x) * 4;
        data[i] = color;
        data[i + 1] = color;
        data[i + 2] = color;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, Math.floor(startX), Math.floor(startY));

    // scanlines + dust
    const lines: number[] = [];
    for (let y = startY + 12; y < endY - 12; y += Math.floor(map(rng(), 0, 1, 0, 100))) {
      lines.push(y);
    }
    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.lineWidth = 1;
    for (const y of lines) {
      ctx.beginPath();
      ctx.moveTo(startX - 1, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      for (let x = startX - 1; x < endX - 1; x++) {
        for (const spread of [2, 4, 8, 12]) {
          ctx.fillRect(x, y + map(rng(), 0, 1, -spread, spread), 1, 1);
        }
      }
    }

    ctx.font = "bold 30px monospace";
    ctx.fillStyle = "rgb(200,200,200)";
    ctx.strokeStyle = "rgb(150,150,150)";
    ctx.lineWidth = 2;
    ctx.strokeText("<< REWIND", startX + 30, startY + 53);
    ctx.fillText("<< REWIND", startX + 30, startY + 53);
    return {};
  },
};
