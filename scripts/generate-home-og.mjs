// Bakes the homepage OG card (1200×630): a flat --coin field with the
// "threesam" wordmark bottom-left and the "certainly uncertain" tagline
// bottom-right in --black — mirroring the homepage's on-page sign-off.
//
// Run: node scripts/generate-home-og.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1200;
const H = 630;
const COIN = "#e8a317"; // --coin
const BLACK = "#1a1a14"; // --black
const FONT = "ui-monospace, Menlo, monospace";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COIN}"/>
  <text x="72" y="556" font-family="${FONT}" font-size="84" font-weight="700" letter-spacing="6" fill="${BLACK}">threesam</text>
  <text x="1128" y="556" text-anchor="end" font-family="${FONT}" font-size="30" letter-spacing="6" fill="${BLACK}">certainly uncertain</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
mkdirSync("static/og", { recursive: true });
writeFileSync("static/og/home.png", png);
console.log(`static/og/home.png — ${png.length} bytes`);
