// Bakes the deana photos into static ASCII webp images at build time, so the
// homepage gallery card can just <img> them instead of converting pixels to
// ASCII in JS on every load (~960ms of main-thread script-eval — see the
// deana gallery card). The /deana page hero is a separate runtime path
// (DEANA_PHOTOS + AsciiImage canvas), not affected by this script.
//
// Two sizes per image for the homepage card's srcset: -lg (retina) and -sm
// (default). Reads the raw photos from static/assets/ and writes the ASCII
// prints to static/assets/deana-ascii/.
//
// Run: pnpm bake:deana

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, parse } from "node:path";

// Raw deana photos stay in static/assets (served in dev, fine); prod uses these
// baked ASCII prints. Source list mirrors ASCII_BASES in $lib/deana/images.ts.
const SRC_DIR = "static/assets";
const SRC_FILES = [
  "deana-6.webp",
  "deana-5.webp",
  "deana-hero-3.webp",
  "deana-hero.webp",
  "deana-hero-5.webp",
  "deana-hero-6.webp",
];
const OUT_DIR = "static/assets/deana-ascii";
// Larger cell -> fewer, chunkier glyphs. CELL=9 is the sweet spot for
// the homepage card: readable as coarse ASCII print without losing the
// portrait. Doesn't affect the /deana page (runtime AsciiImage path).
// Bump DEANA_V in src/lib/deana/images.ts when changing this so the
// browser actually fetches the new bake past Vercel's immutable cache.
const CELL = 9;
const HEIGHT_RATIO = 1.8; // glyph cell is taller than wide
const LG_W = 900; // retina variant for the homepage card srcset
const SM_W = 380; // default variant for the homepage card srcset

// Copied verbatim from src/lib/ascii/ascii-utils.ts so the baked output matches.
const RAMP =
  " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function lumToTone(lum) {
  const stretched = clamp((lum - 0.1) / 0.65, 0, 1);
  const s2 = stretched * stretched * (3 - 2 * stretched);
  return 1 - s2 * s2 * (3 - 2 * s2);
}
const XML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" };
const escapeXml = (c) => XML_ENTITIES[c] ?? c;

async function bake(src) {
  const meta = await sharp(src).metadata();
  const aspect = meta.width / meta.height;
  const cols = Math.round(LG_W / CELL);
  const rows = Math.max(1, Math.round(cols / (aspect * HEIGHT_RATIO)));
  const cellW = CELL;
  const cellH = CELL * HEIGHT_RATIO;
  const W = cols * cellW;
  const H = rows * cellH;
  const fontSize = Math.max(4, Math.floor(cellH * 0.9));

  // Sample the photo down to one pixel per glyph cell (fill — the grid aspect
  // already matches the photo's, so no distortion).
  const { data } = await sharp(src)
    .resize(cols, rows, { fit: "fill" })
    .toColourspace("srgb") // guarantee 3 channels so the RGB indexing below holds
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="rgb(20,20,20)" dominant-baseline="text-before-edge">`,
  ];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const off = (y * cols + x) * 3;
      const lum = (0.2126 * data[off] + 0.7152 * data[off + 1] + 0.0722 * data[off + 2]) / 255;
      const tone = lumToTone(lum);
      const glyph = RAMP[Math.floor(tone * (RAMP.length - 1))] ?? " ";
      if (glyph === " ") continue;
      const alpha = (0.2 + tone * 0.75).toFixed(2);
      parts.push(
        `<text x="${(x * cellW).toFixed(2)}" y="${(y * cellH).toFixed(2)}" fill-opacity="${alpha}">${escapeXml(glyph)}</text>`,
      );
    }
  }
  parts.push("</g></svg>");
  const svg = Buffer.from(parts.join(""));

  const base = parse(src).name;
  mkdirSync(OUT_DIR, { recursive: true });
  const lg = await sharp(svg).webp({ quality: 80 }).toFile(join(OUT_DIR, `${base}-lg.webp`));
  const sm = await sharp(svg)
    .resize(SM_W)
    .webp({ quality: 78 })
    .toFile(join(OUT_DIR, `${base}-sm.webp`));
  return { base, glyphs: parts.length - 3, lg: lg.size, sm: sm.size };
}

for (const f of SRC_FILES) {
  const r = await bake(join(SRC_DIR, f));
  console.log(`${r.base}: ${r.glyphs} glyphs → -lg ${Math.round(r.lg / 1024)}KB, -sm ${Math.round(r.sm / 1024)}KB`);
}
