// Bakes the /thoughts card hero images into tiny grayscale webps at build time.
// At display, the <img> uses `image-rendering: pixelated` so the browser
// nearest-neighbor scales each baked pixel into a ~3px square — the
// "averaging color in B+W with 3px squares" look — without spending any
// runtime CPU on canvas sampling.
//
// Each output pixel is sharp's Lanczos-weighted average of the source
// neighborhood, then grayscale via standard luminance. Output width is sized
// so a typical desktop card (~375 CSS px wide) renders ~13 CSS px per square.
//
// Run: pnpm bake:thoughts

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = "static/assets";
const OUT_DIR = "static/assets/thoughts-pixel";

// Mirrors the cards in src/routes/thoughts/+page.svelte.
// self-hero.webp (landscape, contrasty mid-frame subject) beats
// self-hero-mobile.webp here — the mobile crop is so soft + low-
// variance that 29 grayscale pixels blur into a smooth gradient
// instead of reading as discrete 13px blocks like the other cards.
const TARGETS = [
  { src: "the-peach-src.jpg", out: "the-peach.webp" },
  { src: "certainly-uncertain.webp", out: "certainly-uncertain.webp" },
  { src: "self-hero.webp", out: "self.webp" },
  { src: "benny-photos/033.jpg", out: "benny.webp" },
  { src: "dad-1.webp", out: "dad.webp" },
];

// Cards display ~375 CSS px wide at typical desktop (max-w-7xl, gap-9, 3-up),
// so 29 source pixels nearest-neighbor-scale into ~13 CSS px per square.
const OUT_W = 29;
const OUT_H = Math.round((OUT_W * 5) / 4); // cards are aspect 4/5

mkdirSync(OUT_DIR, { recursive: true });

for (const { src, out } of TARGETS) {
  const info = await sharp(join(SRC_DIR, src))
    .resize(OUT_W, OUT_H, { fit: "cover" })
    .grayscale()
    .webp({ quality: 85 })
    .toFile(join(OUT_DIR, out));
  console.log(`${out}: ${OUT_W}x${OUT_H} grayscale, ${Math.round(info.size / 1024)}KB`);
}
