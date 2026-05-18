import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';

// Hero JPEGs over ~200KB that are LCP candidates
const SOURCES = [
  'static/assets/dad-1.jpg',
  'static/assets/deana-6.jpg',
];

for (const src of SOURCES) {
  try {
    const before = (await stat(src)).size;
    const dest = src.replace(/\.jpe?g$/i, '.webp');
    await sharp(src).webp({ quality: 75 }).toFile(dest);
    const after = (await stat(dest)).size;
    const pct = Math.round((1 - after / before) * 100);
    console.log(
      `${basename(src)}: ${(before / 1024).toFixed(0)} KB → ${basename(dest)}: ${(after / 1024).toFixed(0)} KB (-${pct}%)`,
    );
  } catch (err) {
    console.error(`FAIL ${src}: ${err.message}`);
  }
}
