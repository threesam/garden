#!/usr/bin/env node
// scripts/sounds/deploy-r2.mjs — sync static/audio/sounds/** to the R2 bucket.
//   pnpm sounds:deploy
//
// Uses wrangler (your `wrangler login` session) under the hood, so no S3 keys
// needed. Object keys mirror the URL path (audio/sounds/…) so a public bucket
// serves each file at  PUBLIC_SOUNDS_BASE + manifest `src`.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, relative, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cpus } from "node:os";

const pexec = promisify(execFile);
const BUCKET = process.env.R2_BUCKET || "threesam-sounds";
const ROOT = "static/audio/sounds";
const WRANGLER = join("node_modules", ".bin", "wrangler");
const CONCURRENCY = Math.min(cpus().length, 4); // each wrangler call is a heavy node process
const CACHE = "public, max-age=31536000, immutable"; // filenames are content-stable (date+variant)
const CT = { ".mp3": "audio/mpeg", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

if (!existsSync(ROOT)) {
  console.error(`no ${ROOT}/ — run \`pnpm sounds:ingest\` first`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const keyOf = (p) => relative("static", p).split(sep).join("/"); // → audio/sounds/…
console.log(`uploading ${files.length} objects to r2://${BUCKET}/  (concurrency ${CONCURRENCY})`);

let done = 0;
const failures = [];
const queue = [...files];
async function worker() {
  for (let p = queue.shift(); p; p = queue.shift()) {
    const k = keyOf(p);
    const ct = CT[extname(p).toLowerCase()] || "application/octet-stream";
    try {
      await pexec(WRANGLER, ["r2", "object", "put", `${BUCKET}/${k}`, "--file", p, "--content-type", ct, "--cache-control", CACHE, "--remote", "-y"], { maxBuffer: 16 * 1024 * 1024 });
      if (++done % 10 === 0) console.log(`  …${done}/${files.length}`);
    } catch (err) {
      failures.push({ k, msg: String(err.stderr || err).slice(-200) });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nuploaded ${done}/${files.length} to r2://${BUCKET}`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ${f.k}\n    ${f.msg}`);
  process.exitCode = 1;
}
