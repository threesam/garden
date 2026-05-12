// Bakes static OG images (1200×630) using the same ASCII treatment as
// the runtime <AsciiImage> component — inverted, light glyphs on
// zinc-900. Sources are existing in-app photos.
//
// Run: node scripts/generate-og.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const TARGETS = [
  { src: "public/assets/dad-1.jpg", out: "public/og/dad.png" },
  { src: "public/assets/deana-hero.webp", out: "public/og/deana.png" },
  { src: "public/assets/self-hero.webp", out: "public/og/self.png" },
  { src: "public/assets/anything-but-analog.png", out: "public/og/anything-but-analog.png" },
];

const W = 1200;
const H = 630;
const CELL_W = 6;
const CELL_H = CELL_W * 1.8;
const COLS = Math.floor(W / CELL_W);
const ROWS = Math.floor(H / CELL_H);

const RAMP = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function lumToTone(lum) {
  const stretched = clamp((lum - 0.1) / 0.65, 0, 1);
  const s2 = stretched * stretched * (3 - 2 * stretched);
  return 1 - s2 * s2 * (3 - 2 * s2);
}

function escapeXml(c) {
  if (c === "&") return "&amp;";
  if (c === "<") return "&lt;";
  if (c === ">") return "&gt;";
  if (c === "'") return "&apos;";
  if (c === '"') return "&quot;";
  return c;
}

async function render({ src, out }) {
  const meta = await sharp(src).metadata();
  const imgAspect = meta.width / meta.height;
  const containerAspect = W / H;

  let cropW = meta.width;
  let cropH = meta.height;
  if (imgAspect > containerAspect) cropW = Math.round(meta.height * containerAspect);
  else cropH = Math.round(meta.width / containerAspect);
  const cropLeft = Math.round((meta.width - cropW) / 2);
  const cropTop = Math.round((meta.height - cropH) / 2);

  const { data: pixels } = await sharp(src)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(COLS, ROWS, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const fontSize = Math.max(4, Math.floor(CELL_H * 0.9));
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="#18181b"/>`,
    `<g font-family="ui-monospace, Menlo, monospace" font-size="${fontSize}" fill="#f5f4f0" dominant-baseline="text-before-edge">`,
  ];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const off = (y * COLS + x) * 3;
      const lum = (0.2126 * pixels[off] + 0.7152 * pixels[off + 1] + 0.0722 * pixels[off + 2]) / 255;
      const tone = lumToTone(lum);
      const effective = 1 - tone;
      const idx = Math.floor(effective * (RAMP.length - 1));
      const glyph = RAMP[idx] ?? " ";
      if (glyph === " ") continue;
      const alpha = (0.2 + effective * 0.75).toFixed(2);
      parts.push(
        `<text x="${(x * CELL_W).toFixed(2)}" y="${(y * CELL_H).toFixed(2)}" fill-opacity="${alpha}">${escapeXml(glyph)}</text>`,
      );
    }
  }
  parts.push("</g></svg>");

  const png = await sharp(Buffer.from(parts.join(""))).png().toBuffer();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  return { out, bytes: png.length, glyphs: parts.length - 4 };
}

async function renderDefault() {
  // Typographic site-wide fallback — no source image.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#18181b"/>
    <text x="80" y="320" font-family="ui-monospace, Menlo, monospace" font-size="170" font-weight="700" fill="#f5f4f0" letter-spacing="-4">threesam</text>
    <text x="80" y="400" font-family="ui-monospace, Menlo, monospace" font-size="32" fill="#e8a317" letter-spacing="4">SIGNAL · SOURCE · RESONANCE</text>
    <text x="80" y="550" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#a1a1aa">artist-engineer at the intersection of sound, code, and human performance</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const out = "public/og/default.png";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  return { out, bytes: png.length, glyphs: 0 };
}

const [results, def] = await Promise.all([
  Promise.all(TARGETS.map(render)),
  renderDefault(),
]);
for (const r of results) console.log(`${r.out} — ${r.glyphs} glyphs, ${r.bytes} bytes`);
console.log(`${def.out} — ${def.bytes} bytes`);
