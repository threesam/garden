#!/usr/bin/env node
// scripts/sounds/ingest.mjs — scan FL + sc-inventory, build the catalog, encode
// audio (subsonic roll-off + EBU R128 loudness normalization), write the manifest.
//
//   node scripts/sounds/ingest.mjs --dry-run   (print the plan, write nothing)
//   node scripts/sounds/ingest.mjs             (encode + write manifest)
//
// Every track moved over is run through:
//   highpass=f=30                 — roll off inaudible sub-bass / rumble / DC
//   loudnorm=I=-14:TP=-1:LRA=11   — normalize to a consistent perceived loudness
import { readdirSync, statSync, existsSync, readFileSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { AUDIO_EXTS, DEFAULT_ART_MIN, analyze, canon, buildCatalog } from "./grouping.mjs";

const DRY = process.argv.includes("--dry-run");
// First ffmpeg that actually runs. Skips conda/miniforge builds that fail to
// load (e.g. missing libopenh264). Override with FFMPEG=/path/to/ffmpeg.
function resolveFfmpeg() {
  const candidates = [process.env.FFMPEG, "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"].filter(Boolean);
  for (const c of candidates) {
    try { execFileSync(c, ["-version"], { stdio: "ignore" }); return c; } catch { /* try next */ }
  }
  throw new Error(`no working ffmpeg found (tried: ${candidates.join(", ")})`);
}
const AUDIO_FILTER = "highpass=f=30,loudnorm=I=-14:TP=-1:LRA=11";
const FL_ROOT = join(homedir(), "Documents", "Image-Line", "FL Studio", "Projects");
const FL_SUBS = ["me", "sk+w"];
const SC_DIR = "sc-inventory";
const MANIFEST = "src/lib/sounds/manifest.json";
const AUDIO_OUT_ROOT = "static/audio/sounds";

const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function walk(root, rel = "") {
  const out = [];
  for (const e of readdirSync(join(root, rel))) {
    const childRel = rel ? join(rel, e) : e;
    const st = statSync(join(root, childRel));
    if (st.isDirectory()) out.push(...walk(root, childRel));
    else if (st.isFile() && AUDIO_EXTS.has(extname(e).toLowerCase()))
      out.push({ rel: childRel, size: st.size, date: fmtDate(st.birthtime), abs: join(root, childRel) });
  }
  return out;
}

function scanFL() {
  const files = [];
  for (const sub of FL_SUBS) {
    const dir = join(FL_ROOT, sub);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) {
      const ext = extname(f.rel).toLowerCase();
      files.push({ sub, rel: f.rel, ext, stem: basename(f.rel, ext).toLowerCase(), dir: dirname(f.rel), size: f.size, date: f.date, abs: f.abs });
    }
  }
  return files;
}

function loadSC() {
  const meta = join(SC_DIR, "tracks.jsonl");
  if (!existsSync(meta)) return [];
  const idRe = /\[(\d+)\]/;
  const artById = new Map();
  const artDir = join(SC_DIR, "art");
  if (existsSync(artDir)) for (const f of readdirSync(artDir)) { const m = f.match(idRe); if (m) artById.set(m[1], join(artDir, f)); }
  const audioById = new Map();
  const audioDir = join(SC_DIR, "audio");
  if (existsSync(audioDir)) for (const f of readdirSync(audioDir)) { const m = f.match(idRe); if (m && /\.mp3$/i.test(f)) audioById.set(m[1], join(audioDir, f)); }

  const hashCount = new Map(), hashById = new Map();
  for (const [id, p] of artById) { const h = createHash("md5").update(readFileSync(p)).digest("hex"); hashById.set(id, h); hashCount.set(h, (hashCount.get(h) || 0) + 1); }
  const defaults = new Set([...hashCount].filter(([, n]) => n >= DEFAULT_ART_MIN).map(([h]) => h));

  return readFileSync(meta, "utf8").trim().split("\n").map((line) => {
    const d = JSON.parse(line); const id = String(d.id); const a = analyze(d.title);
    const up = d.upload_date || ""; const date = up.length === 8 ? `${up.slice(0, 4)}-${up.slice(4, 6)}-${up.slice(6)}` : "1970-01-01";
    const audioPath = audioById.get(id) || null;
    return { id, title: d.title, cleanTitle: a.title, variant: a.variant, slug: canon(d.title), date, artPath: artById.get(id) || null, isDefaultArt: !artById.has(id) || defaults.has(hashById.get(id)), audioPath, size: audioPath ? statSync(audioPath).size : 0 };
  });
}

const { manifest, conversions, covers, flags } = buildCatalog({ flFiles: scanFL(), scTracks: loadSC() });

console.log(`demos: ${manifest.demos.eps.reduce((n, e) => n + e.songs.length, 0)} EP songs + ${manifest.demos.singles.length} singles`);
console.log(`scores: ${manifest.scores.hmbm.length} cues + ${manifest.scores.skw.length} sk+w`);
console.log(`audio:  ${conversions.length} files to encode · ${covers.length} covers · ${flags.placeholders.length} placeholders`);
console.log(`flags:  untitled = ${flags.untitled.join(", ") || "none"}`);
console.log(`set aside: ${flags.ignored.length} working files · ${flags.excluded.length} excluded from scores`);

if (DRY) { console.log("\n[dry-run] no files written."); process.exit(0); }

const FFMPEG = resolveFfmpeg();
console.log(`ffmpeg: ${FFMPEG}\nfilter: ${AUDIO_FILTER}\n`);

// fresh output tree so removed/renamed tracks don't linger
rmSync(AUDIO_OUT_ROOT, { recursive: true, force: true });

let done = 0;
const failures = [];
for (const conv of conversions) {
  mkdirSync(dirname(conv.to), { recursive: true });
  try {
    execFileSync(FFMPEG, ["-y", "-i", conv.from, "-af", AUDIO_FILTER, "-codec:a", "libmp3lame", "-b:a", "192k", conv.to], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err) {
    failures.push({ from: conv.from, msg: String(err.stderr || err).slice(-200) });
    continue;
  }
  if (++done % 10 === 0) console.log(`  …encoded ${done}/${conversions.length}`);
}
for (const cov of covers) { mkdirSync(dirname(cov.to), { recursive: true }); copyFileSync(cov.from, cov.to); }
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nencoded ${done}/${conversions.length} audio files, ${covers.length} covers → ${AUDIO_OUT_ROOT}/`);
console.log(`wrote ${MANIFEST}`);
if (failures.length) { console.log(`\n${failures.length} FAILED:`); for (const f of failures) console.log(`  ${f.from}\n    ${f.msg}`); process.exitCode = 1; }
