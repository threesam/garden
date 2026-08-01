// Bakes the homepage OG card (1200×630): the dot-matrix "threesam" wordmark
// centred on a flat --coin field.
//
// The mark is composited from static/assets/threesam-wordmark.svg rather than
// set as text. That file is the wordmark — Michroma letterforms resolved onto a
// 171×24 dot grid, then hand-corrected — so there is no font to resolve here.
// It also sidesteps the reason this script could never use a custom face:
// sharp renders SVG through librsvg, which resolves fonts via fontconfig and
// cannot load a font file by path. Geometry has no such problem.
//
// The mark spans 940px — a 130px inset each side. LinkedIn's Featured card
// crops a 1.91:1 OG image to ~1.59:1, trimming ~98px off each edge; 130px
// clears that with buffer.
//
// Run: node scripts/generate-home-og.mjs

import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const W = 1200;
const H = 630;
const MARK_W = 940;
const COIN = "#e8a317"; // --coin

const mark = readFileSync("static/assets/threesam-wordmark.svg", "utf8");
const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(mark);
if (!viewBox) throw new Error("wordmark svg is missing a viewBox — cannot scale it");
const [, cols, rows] = viewBox.map(Number);

// Strip the outer <svg> wrapper so the mark's own <g> can be nested with an
// explicit viewBox; keeping the wrapper would carry its width/height through.
const inner = mark.replace(/^[\s\S]*?<title>.*?<\/title>/, "").replace(/<\/svg>\s*$/, "");
const markH = (MARK_W * rows) / cols;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COIN}"/>
  <svg x="${(W - MARK_W) / 2}" y="${(H - markH) / 2}" width="${MARK_W}" height="${markH}" viewBox="0 0 ${cols} ${rows}">${inner}</svg>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
mkdirSync("static/og", { recursive: true });
writeFileSync("static/og/home.png", png);
console.log(`static/og/home.png — ${png.length} bytes`);
