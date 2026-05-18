import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';

const SOURCES = [
  'static/assets/anything-but-analog.png',
  'static/assets/velvet-door.png',
  'static/assets/adventure.png',
  'static/assets/dissonance.png',
  'static/assets/blondie.png',
];

for (const src of SOURCES) {
  try {
    const before = (await stat(src)).size;
    const dest = src.replace(/\.png$/, '.webp');
    await sharp(src)
      .webp({ quality: 70 })
      .toFile(dest);
    const after = (await stat(dest)).size;
    const pct = Math.round((1 - after / before) * 100);
    console.log(`${basename(src)}: ${(before / 1024).toFixed(0)} KB → ${basename(dest)}: ${(after / 1024).toFixed(0)} KB (-${pct}%)`);
  } catch (err) {
    console.error(`FAIL ${src}: ${err.message}`);
  }
}
