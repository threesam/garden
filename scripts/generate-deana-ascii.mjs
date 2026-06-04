// Bakes the deana photos into static ASCII webp images so the homepage
// gallery card and /deana hero can <img> them instead of running the
// canvas-based AsciiImage renderer on every load (~960ms script-eval saved).
//
// Two sizes per image via srcset (-lg retina, -sm default). Reads from
// static/assets/ and writes to static/assets/deana-ascii/.
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
// Larger cell -> fewer, chunkier glyphs. CELL=3 maximises facial detail
// at the /deana hero scale — at the 1440 px desktop display the upscale
// from the 700 px source leaves each glyph at ~6 CSS px, dense enough
// to read as a portrait, sparse enough to still see the grid.
// Bump DEANA_V in src/lib/deana/images.ts when changing this so the
// browser actually fetches the new bake past Vercel's immutable cache.
const CELL = 3;
const HEIGHT_RATIO = 1.8; // glyph cell is taller than wide
// The card displays at ~432px wide on lg (30vw of 1440) and full-bleed on
// /deana (100vw). LG=700 is enough headroom for 2x retina at the card and
// reads fine on a wide /deana hero (slight upscale is invisible at this
// glyph density). Halving from 900 → 700 is the single biggest bytes win
// on this content — pixel count drops ~40%.
const LG_W = 700;
const SM_W = 320;

// RAMP + lumToTone copied verbatim from src/lib/ascii/ascii-utils.ts so
// per-cell glyph selection matches the runtime path. Compositing differs:
// this bake uses opaque quantized grays over a solid bg so the webp encoder
// can drop the alpha plane (see grayFor below).
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

  // Solid cream background + opaque per-glyph grays — zero alpha anywhere.
  // The card has nothing behind it; the image IS the card. Encoding tone as
  // *color* (lerp from bg cream to dark) instead of *alpha* (over solid bg)
  // is the bytes-saving move: webp doesn't waste its quality budget
  // reconstructing soft alpha falloffs, and the gray palette quantizes to
  // ~8 distinct shades that DCT eats easily. Cuts SM from ~50 KB → ~15 KB.
  const BG = [245, 244, 240]; // --white brand cream
  const FG = [20, 20, 20]; // near-black
  // 8 quantized tone levels — visually indistinguishable from continuous,
  // but the encoder sees a tiny palette and compresses aggressively.
  const TONE_LEVELS = 8;
  const grayCache = new Map();
  const grayFor = (t) => {
    const q = Math.round(t * (TONE_LEVELS - 1)) / (TONE_LEVELS - 1);
    let hex = grayCache.get(q);
    if (hex) return hex;
    const r = Math.round(BG[0] + (FG[0] - BG[0]) * q);
    const g = Math.round(BG[1] + (FG[1] - BG[1]) * q);
    const b = Math.round(BG[2] + (FG[2] - BG[2]) * q);
    hex = `rgb(${r},${g},${b})`;
    grayCache.set(q, hex);
    return hex;
  };
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="rgb(${BG[0]},${BG[1]},${BG[2]})"/>`,
    `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" dominant-baseline="text-before-edge">`,
  ];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const off = (y * cols + x) * 3;
      const lum = (0.2126 * data[off] + 0.7152 * data[off + 1] + 0.0722 * data[off + 2]) / 255;
      const tone = lumToTone(lum);
      const glyph = RAMP[Math.floor(tone * (RAMP.length - 1))] ?? " ";
      if (glyph === " ") continue;
      parts.push(
        `<text x="${(x * cellW).toFixed(2)}" y="${(y * cellH).toFixed(2)}" fill="${grayFor(0.2 + tone * 0.75)}">${escapeXml(glyph)}</text>`,
      );
    }
  }
  parts.push("</g></svg>");
  const svg = Buffer.from(parts.join(""));

  const base = parse(src).name;
  mkdirSync(OUT_DIR, { recursive: true });
  // Lossy webp. We tried lossless first (great in theory for our 8-tone
  // palette) but the rasterized text edges defeat its entropy coder — lossy
  // wins. q=69 paired with the CELL=3 bake — at q=40 the tiny glyphs
  // smeared into a muddy gradient (read as "overcompressed"); q=69 keeps
  // each glyph readable while still ~3× smaller than lossless.
  const WEBP_OPTS = { quality: 69, effort: 6, smartSubsample: true };
  const lg = await sharp(svg).webp(WEBP_OPTS).toFile(join(OUT_DIR, `${base}-lg.webp`));
  const sm = await sharp(svg)
    .resize(SM_W)
    .webp(WEBP_OPTS)
    .toFile(join(OUT_DIR, `${base}-sm.webp`));
  return { base, glyphs: parts.length - 3, lg: lg.size, sm: sm.size };
}

for (const f of SRC_FILES) {
  const r = await bake(join(SRC_DIR, f));
  console.log(`${r.base}: ${r.glyphs} glyphs → -lg ${Math.round(r.lg / 1024)}KB, -sm ${Math.round(r.sm / 1024)}KB`);
}
