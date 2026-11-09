// Smaller twins of big single images, offered through srcset so a phone
// downloads the pixels it can show instead of the full original. The original
// stays the largest candidate, so dense or wide screens see exactly what they
// saw before.
//
// Run: node scripts/image-twins.mjs

import sharp from "sharp";

const TWINS = [
  // the peach essay hero (1080 wide), ~364 CSS px on a phone
  { src: "static/assets/the-peach-src.jpg", out: "static/assets/the-peach", widths: [720] },
  // the /benny banner (2480 wide), full-bleed
  { src: "static/assets/sixtomidnight-banner.jpg", out: "static/assets/sixtomidnight-banner", widths: [800, 1600] },
];

for (const { src, out, widths } of TWINS) {
  for (const w of widths) {
    const file = `${out}-${w}.webp`;
    const info = await sharp(src).resize({ width: w }).webp({ quality: 80 }).toFile(file);
    console.log(`${file}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
  }
}
