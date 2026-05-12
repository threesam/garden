// Bakes the live cloud shader to a static WebP. The runtime sprite
// renders this once via <Image fill> with optional CSS scaleY(-1) for
// the header/footer mirror — eliminates the WebGL context and per-frame
// fragment shader in production.
//
// The shader's sin(vUv.x * π) horizontal window fades the strip's left
// and right edges to bg color, so the image composites cleanly over
// any container without seams.
//
// Run: node scripts/bake-clouds.mjs

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const W = 3840;
const H = 360;
const OUT = "public/assets/clouds.webp";

const NOISE_SIZE = 256;
const NOISE_CELLS = 8;
const TIME = 0;

// Theme colors — match globals.css --white / --black.
const TOP = parseHex("#f5f4f0");
const BOT = parseHex("#1a1a14");

function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function buildNoise(size) {
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  const grad = (h, x, y) => {
    const k = h & 7;
    const u = k < 4 ? x : y;
    const v = k < 4 ? y : x;
    const a = (k & 1) === 0 ? u : -u;
    const b = (k & 2) === 0 ? v : -v;
    return a + b;
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);

  function perlin(x, y, period) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const px = ((xi % period) + period) % period;
    const py = ((yi % period) + period) % period;
    const px1 = (px + 1) % period;
    const py1 = (py + 1) % period;
    const fx = x - xi;
    const fy = y - yi;
    const aa = grad(perm[(perm[px] + py) & 255], fx, fy);
    const ba = grad(perm[(perm[px1] + py) & 255], fx - 1, fy);
    const ab = grad(perm[(perm[px] + py1) & 255], fx, fy - 1);
    const bb = grad(perm[(perm[px1] + py1) & 255], fx - 1, fy - 1);
    const u = fade(fx);
    const v = fade(fy);
    return Math.max(0, Math.min(1, lerp(lerp(aa, ba, u), lerp(ab, bb, u), v) * 0.5 + 0.5));
  }

  function fbm(x, y, basePeriod, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * perlin(x * frequency, y * frequency, basePeriod * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return Math.max(0, Math.min(1, value));
  }

  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * NOISE_CELLS;
      const ny = (y / size) * NOISE_CELLS;
      data[y * size + x] = fbm(nx, ny, NOISE_CELLS, 4);
    }
  }
  return data;
}

// Bilinear noise sample with REPEAT wrap — matches WebGL LINEAR + REPEAT.
function sample(noise, size, u, v) {
  let uu = ((u % 1) + 1) % 1;
  let vv = ((v % 1) + 1) % 1;
  const fx = uu * size;
  const fy = vv * size;
  const x0 = Math.floor(fx) % size;
  const y0 = Math.floor(fy) % size;
  const x1 = (x0 + 1) % size;
  const y1 = (y0 + 1) % size;
  const tx = fx - Math.floor(fx);
  const ty = fy - Math.floor(fy);
  const a = noise[y0 * size + x0];
  const b = noise[y0 * size + x1];
  const c = noise[y1 * size + x0];
  const d = noise[y1 * size + x1];
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function cloudDensity(noise, u, v, scale, offX, offY, threshold) {
  const n = sample(noise, NOISE_SIZE, u * scale + offX, v * scale + offY);
  const shaped = clamp((n - threshold) * 3, 0, 1);
  return shaped * shaped;
}

const noise = buildNoise(NOISE_SIZE);

const t = -TIME * 0.005;
const LAYERS = [
  { scale: 0.25, offX: t * 1 * 0.25 + 0.137, offY: 0.241, col: [230 / 255, 100 / 255, 140 / 255] },
  { scale: 0.5, offX: t * 3 * 0.5 + 0.274, offY: 0.482, col: [235 / 255, 150 / 255, 50 / 255] },
  { scale: 1.0, offX: t * 6 * 1.0 + 0.411, offY: 0.723, col: [250 / 255, 220 / 255, 60 / 255] },
];

const pixels = Buffer.alloc(W * H * 3);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const vUvx = x / W;
    const vUvy = y / H;
    const uvX = vUvx;
    const uvY = 1 - vUvy;

    const easedFade = uvY * uvY;
    let r = TOP[0] * (1 - easedFade) + BOT[0] * easedFade;
    let g = TOP[1] * (1 - easedFade) + BOT[1] * easedFade;
    let b = TOP[2] * (1 - easedFade) + BOT[2] * easedFade;

    const window = Math.sin(uvY * Math.PI) * Math.sin(vUvx * Math.PI);

    for (const L of LAYERS) {
      const d = cloudDensity(noise, uvX, uvY, L.scale, L.offX, L.offY, 0.32);
      const i = d * window * 0.45;
      r = r * (1 - i) + L.col[0] * i;
      g = g * (1 - i) + L.col[1] * i;
      b = b * (1 - i) + L.col[2] * i;
    }

    const off = (y * W + x) * 3;
    pixels[off] = Math.round(clamp(r, 0, 1) * 255);
    pixels[off + 1] = Math.round(clamp(g, 0, 1) * 255);
    pixels[off + 2] = Math.round(clamp(b, 0, 1) * 255);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
await sharp(pixels, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 80, effort: 6 })
  .toFile(OUT);

console.log(`${OUT} — ${W}×${H} baked`);
