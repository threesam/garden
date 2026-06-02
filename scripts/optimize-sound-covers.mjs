// One-shot: fetch every /sounds cover from the R2 origin, resize/encode
// to webp, and write to static/ so the build serves them with Vercel's
// immutable cache instead of hitting R2 with raw multi-hundred-KB JPEGs.
//
// Run: PUBLIC_SOUNDS_BASE=https://pub-...r2.dev node scripts/optimize-sound-covers.mjs
// Idempotent — skips covers whose .webp already exists locally.

import sharp from "sharp";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_ROOT = join(REPO_ROOT, "static");
const MANIFEST = join(REPO_ROOT, "src/lib/sounds/manifest.json");
const BASE =
  process.env.PUBLIC_SOUNDS_BASE ?? "https://pub-8f57a973c6474360ad0635348f674992.r2.dev";

const manifest = JSON.parse(await import("node:fs").then((m) => m.readFileSync(MANIFEST, "utf-8")));

const collect = (obj, out = new Set()) => {
  if (!obj) return out;
  if (Array.isArray(obj)) { for (const v of obj) collect(v, out); return out; }
  if (typeof obj === "object") {
    if (typeof obj.cover === "string") out.add(obj.cover);
    for (const v of Object.values(obj)) collect(v, out);
  }
  return out;
};
const covers = [...collect(manifest)];

let bytesIn = 0;
let bytesOut = 0;
let done = 0;
let skipped = 0;

for (const path of covers) {
  const outRel = path.replace(/\.[a-z]+$/i, ".webp");
  const outAbs = join(STATIC_ROOT, outRel);
  mkdirSync(dirname(outAbs), { recursive: true });
  if (existsSync(outAbs)) {
    skipped++;
    continue;
  }
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`SKIP ${path} (${res.status})`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  bytesIn += buf.byteLength;
  const optimized = await sharp(buf)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  writeFileSync(outAbs, optimized);
  bytesOut += optimized.byteLength;
  const pct = Math.round((1 - optimized.byteLength / buf.byteLength) * 100);
  console.log(
    `${basename(path)}: ${(buf.byteLength / 1024).toFixed(0)} KB -> ${(optimized.byteLength / 1024).toFixed(0)} KB (-${pct}%)`,
  );
  done++;
}

console.log(
  `\n${done} written, ${skipped} skipped. ${(bytesIn / 1024).toFixed(0)} KB in -> ${(bytesOut / 1024).toFixed(0)} KB out`,
);
