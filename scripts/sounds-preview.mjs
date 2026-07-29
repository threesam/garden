#!/usr/bin/env node
// sounds-preview.mjs — READ-ONLY grouping preview for the /sounds page.
//
// Two sources, merged:
//   1. FL Studio project folders (recursive)      → lossless WAV masters
//   2. sc-inventory/ (pulled from soundcloud)      → SC-only audio + the
//                                                     title/cover metadata layer
//
// Model:
//   collection (demos | scores)
//     └─ project / EP  (404, fa11faster, early singles, …)
//          └─ song      (a stack of dated versions, across folders + soundcloud)
//               └─ version  (date · variant · source: local wav | soundcloud mp3)
//
// Cover rule: a song's cover is its SoundCloud art, UNLESS that art is the
// avatar-default (shared by ≥3 tracks) or there's no SC match — then it's the
// "?" placeholder (--coin on --black).
//
// Nothing is copied or converted. Tweak CONFIG, re-run.   node scripts/sounds-preview.mjs

import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";

// ─── CONFIG — the knobs we iterate on ─────────────────────────────────────────

const SOURCE_ROOT = join(homedir(), "Documents", "Image-Line", "FL Studio", "Projects");
const SUBFOLDERS = ["me", "sk+w"]; // eleanor dropped
const OUT_ROOT = "static/audio/sounds";

const SC_DIR = "sc-inventory";
const SC_META = join(SC_DIR, "tracks.jsonl");
const SC_ART = join(SC_DIR, "art");
const SC_AUDIO = join(SC_DIR, "audio");
const DEFAULT_ART_MIN = 3; // an art hash shared by ≥ this many tracks = avatar default

const AUDIO_EXTS = new Set([".wav", ".flac", ".mp3", ".aiff", ".aif"]);
const EXT_RANK = { ".wav": 0, ".flac": 1, ".aiff": 2, ".aif": 2, ".mp3": 3 };

const NOISE_RULES = [
  { test: (h, p) => /with click/.test(h) || p.some((x) => /^\d+\s*bpm$/.test(x)) || /\b\d+\s*bpm\b/.test(h), reason: "click bounce" },
  { test: (h) => /\baudio only\b/.test(h), reason: "audio-only export" },
  { test: (h) => /\bconsolidated\b/.test(h), reason: "consolidated stem" },
];

// Variant descriptors peeled off the title. ORDER MATTERS (specific first).
const VARIANT_RULES = [
  { test: /\bnot[ -]?raw\b/, label: "not-raw" },
  { test: /\braw\b/, label: "raw" },
  { test: /\buncut\b/, label: "uncut" },
  { test: /\binstrumental\b/, label: "instrumental" },
  { test: /\bacoustic guitar\b/, label: "acoustic-guitar" },
  { test: /\bacoustic\b/, label: "acoustic" },
  { test: /\byear[ -]?one\b/, label: "year-one" },
  { test: /\blimited\b/, label: "limited" },
  { test: /\bmixed\b/, label: "mixed" },
  { test: /\brough\b/, label: "rough" },
  { test: /\bdemo\b/, label: "demo" },
  { test: /\blive\b/, label: "live" },
  { test: /\bremix\b/, label: "remix" },
];

// Manual same-song merges the filename heuristic can't infer. slug → canonical.
const ALIASES = {
  "server-error": "identity-theft-is-not-a-joke",
  "make-it-obvious": "obvious",
};
const DEMO_PROJECT_ORDER = ["404", "fa11faster", "early", "misc"];
const EP_PROJECTS = new Set(["404", "fa11faster"]); // their own dirs; everything else is flat in demos/

function resolveProject(sub, rel) {
  const file = basename(rel);
  if (sub === "me") {
    if (rel.startsWith("actually trying/the way/")) return { collection: "demos", project: "404", label: "404 (EP)" };
    if (rel.startsWith("actually trying/fa11faster/")) return { collection: "demos", project: "fa11faster", label: "fa11faster (EP)" };
    if (rel.startsWith("actually trying/")) return { collection: "demos", project: "404", label: "404 (EP)" };
    if (/^hmbm\b/i.test(file)) return { collection: "scores", project: "hmbm", label: "hmbm (score)" };
    return { collection: "demos", project: "early", label: "early singles" };
  }
  if (sub === "sk+w") {
    if (rel.startsWith("hmbm - foley/")) return { collection: "scores", project: "hmbm", label: "hmbm (score)" };
    if (rel.startsWith("hmbm/")) return { collection: "scores", project: "hmbm", label: "hmbm (score)" };
    return { collection: "scores", project: "sk+w", label: "sk+w" };
  }
  return { collection: "demos", project: "misc", label: "misc" };
}

function scoreKind(rel, file) {
  if (rel.includes("hmbm - foley/")) return "foley";
  if (/\d{1,2}:\d{2}:\d{2}/.test(file)) return "cue";
  if (/^hmbm\b/i.test(file)) return "theme";
  return "track";
}

const SCORE_KEEP = {
  hmbm: (rec) => rec.kind === "cue",
  "sk+w": (rec) => ["polka-dot-dress", "quintessentially-unaware"].includes(rec.slug),
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const c = process.env.NO_COLOR
  ? new Proxy({}, { get: () => (s) => s })
  : {
      dim: (s) => `\x1b[2m${s}\x1b[0m`,
      bold: (s) => `\x1b[1m${s}\x1b[0m`,
      cyan: (s) => `\x1b[36m${s}\x1b[0m`,
      green: (s) => `\x1b[32m${s}\x1b[0m`,
      yellow: (s) => `\x1b[33m${s}\x1b[0m`,
      red: (s) => `\x1b[31m${s}\x1b[0m`,
      mag: (s) => `\x1b[35m${s}\x1b[0m`,
      blue: (s) => `\x1b[34m${s}\x1b[0m`,
    };

const slugify = (s) =>
  s.toLowerCase().replace(/['’`]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const fmtMB = (b) => `${(b / 1048576).toFixed(1)}MB`;
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ymd = (s) => (s && s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : "????-??-??");

function analyze(nameNoExt) {
  let s = nameNoExt.toLowerCase().trim().replace(/_/g, " ");
  const parens = [];
  s = s.replace(/\(([^)]*)\)/g, (_m, inner) => (parens.push(inner.trim()), " "));
  s = s.replace(/\s+/g, " ").trim();
  const hay = `${s} ${parens.join(" ")}`.replace(/\s+/g, " ").trim();

  let noise = null;
  for (const rule of NOISE_RULES) if (rule.test(hay, parens)) { noise = rule.reason; break; }

  let variant = "main";
  for (const rule of VARIANT_RULES) {
    if (rule.test.test(s) || parens.some((p) => rule.test.test(p))) { variant = rule.label; s = s.replace(rule.test, " "); break; }
  }

  const title = s
    .replace(/with click/g, " ").replace(/\baudio only\b/g, " ").replace(/\bconsolidated\b/g, " ")
    .replace(/\b\d+\s*bpm\b/g, " ").replace(/\s*[-–]\s*$/g, " ").replace(/^\s*[-–]\s*/g, " ")
    .replace(/\s+/g, " ").trim();
  return { title, variant, noise };
}

// canonical song slug for matching across sources (FL + soundcloud)
const canon = (title) => {
  const s = slugify(analyze(title).title);
  return ALIASES[s] ?? s;
};

function walk(root, rel = "") {
  const out = [];
  for (const entry of readdirSync(join(root, rel))) {
    const childRel = rel ? join(rel, entry) : entry;
    const st = statSync(join(root, childRel));
    if (st.isDirectory()) out.push(...walk(root, childRel));
    else if (st.isFile() && AUDIO_EXTS.has(extname(entry).toLowerCase())) out.push({ rel: childRel, size: st.size, date: fmtDate(st.birthtime) });
  }
  return out;
}

// ─── SoundCloud layer ─────────────────────────────────────────────────────────

function loadSoundcloud() {
  if (!existsSync(SC_META)) return { byCanon: new Map(), tracks: [] };

  // id → art path; id → audio path
  const artById = new Map();
  const idRe = /\[(\d+)\]/;
  if (existsSync(SC_ART)) for (const f of readdirSync(SC_ART)) { const m = f.match(idRe); if (m) artById.set(m[1], join(SC_ART, f)); }
  const audioById = new Map();
  if (existsSync(SC_AUDIO)) for (const f of readdirSync(SC_AUDIO)) { const m = f.match(idRe); if (m && /\.mp3$/i.test(f)) audioById.set(m[1], join(SC_AUDIO, f)); }

  // hash art → detect the avatar-default shared by many tracks
  const hashCount = new Map();
  const hashById = new Map();
  for (const [id, p] of artById) {
    const h = createHash("md5").update(readFileSync(p)).digest("hex");
    hashById.set(id, h);
    hashCount.set(h, (hashCount.get(h) || 0) + 1);
  }
  const defaultHashes = new Set([...hashCount].filter(([, n]) => n >= DEFAULT_ART_MIN).map(([h]) => h));

  const tracks = [];
  for (const line of readFileSync(SC_META, "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    const id = String(d.id);
    const a = analyze(d.title);
    const audioPath = audioById.get(id) || null;
    tracks.push({
      id,
      title: d.title,
      cleanTitle: a.title,
      variant: a.variant,
      slug: canon(d.title),
      date: ymd(d.upload_date),
      url: d.webpage_url,
      duration: d.duration,
      artPath: artById.get(id) || null,
      isDefaultArt: !artById.has(id) || defaultHashes.has(hashById.get(id)),
      audioPath,
      size: audioPath ? statSync(audioPath).size : 0,
    });
  }
  const byCanon = new Map();
  for (const t of tracks) { if (!byCanon.has(t.slug)) byCanon.set(t.slug, []); byCanon.get(t.slug).push(t); }
  return { byCanon, tracks };
}

// ─── scan FL ─────────────────────────────────────────────────────────────────

if (!existsSync(SOURCE_ROOT)) { console.error(c.red(`source root not found: ${SOURCE_ROOT}`)); process.exit(1); }

const ignored = [];
const needsAttention = [];

const raw = [];
for (const sub of SUBFOLDERS) {
  const dir = join(SOURCE_ROOT, sub);
  if (!existsSync(dir)) { console.error(c.yellow(`(skipping missing folder: ${sub})`)); continue; }
  for (const f of walk(dir)) {
    const ext = extname(f.rel).toLowerCase();
    raw.push({ sub, rel: f.rel, ext, stem: basename(f.rel, ext).toLowerCase(), dir: dirname(f.rel), size: f.size, date: f.date });
  }
}

// exact-name dedup (same folder + stem, different ext → keep most master-y)
const byStem = new Map();
for (const r of raw) {
  const k = `${r.sub}/${r.dir}/${r.stem}`;
  const cur = byStem.get(k);
  if (!cur) { byStem.set(k, r); continue; }
  const keep = EXT_RANK[r.ext] < EXT_RANK[cur.ext] ? r : cur;
  const drop = keep === r ? cur : r;
  ignored.push({ reason: `duplicate export (kept ${keep.ext})`, src: `${drop.sub}/${drop.rel}` });
  byStem.set(k, keep);
}

const demoFiles = [];
const scoreFiles = [];
for (const r of byStem.values()) {
  const loc = resolveProject(r.sub, r.rel);
  const file = basename(r.rel);
  const { title, variant, noise } = analyze(basename(file, extname(file)));
  const slug = slugify(title);
  const rec = { ...r, ...loc, file, title, variant, slug, source: "local" };
  if (noise) { ignored.push({ reason: noise, src: `${r.sub}/${r.rel}` }); continue; }
  if (loc.collection === "scores") scoreFiles.push({ ...rec, kind: scoreKind(r.rel, file) });
  else demoFiles.push(rec);
}

// ─── build demo songs (FL) then merge soundcloud ──────────────────────────────

const sc = loadSoundcloud();
const songs = new Map();
for (const r of demoFiles) {
  if (!r.slug) continue;
  const canonSlug = ALIASES[r.slug] ?? r.slug;
  if (!songs.has(canonSlug)) songs.set(canonSlug, { slug: canonSlug, versions: [] });
  songs.get(canonSlug).versions.push(r);
}

// soundcloud-only tracks become real songs (audio lives in sc-inventory/audio)
for (const [slug, list] of sc.byCanon) {
  if (songs.has(slug)) continue; // we have a local master — SC is just metadata here
  const scOnly = list.filter((t) => t.audioPath); // only the ones we actually grabbed
  if (!scOnly.length) continue;
  songs.set(slug, {
    slug,
    versions: scOnly.map((t) => ({
      sub: "soundcloud", rel: basename(t.audioPath), date: t.date, variant: t.variant, size: t.size,
      project: "early", label: "early singles", source: "soundcloud",
    })),
  });
}

// finalize each song: newest-first, placement, title + cover from soundcloud
const projects = new Map();
for (const song of songs.values()) {
  song.versions.sort((a, b) => b.date.localeCompare(a.date));
  const newest = song.versions[0];
  song.project = newest.project;
  song.label = newest.label;
  song.latest = newest.date;
  song.untitled = song.slug.startsWith("untitled");
  song.scOnly = song.versions.every((v) => v.source === "soundcloud");

  // soundcloud metadata layer
  const matches = sc.byCanon.get(song.slug) || [];
  const primary = matches.find((t) => t.variant === "main" && t.slug === song.slug) || matches.find((t) => !t.isDefaultArt) || matches[0];
  song.title = primary?.cleanTitle || newest.title || song.slug;
  const coverTrack = matches.find((t) => !t.isDefaultArt) || null;
  song.cover = coverTrack?.artPath || null;
  song.coverPlaceholder = !song.cover;

  if (song.untitled) needsAttention.push({ kind: "untitled", slug: song.slug, note: "needs a real title", src: song.versions.map((v) => v.rel).join(", ") });

  if (!projects.has(song.project)) projects.set(song.project, { label: song.label, songs: [] });
  projects.get(song.project).songs.push(song);
}
for (const p of projects.values()) p.songs.sort((a, b) => b.latest.localeCompare(a.latest));

// orphan demo songs (all files were noise AND no soundcloud rescue)
for (const r of raw) {
  const ext = extname(r.rel).toLowerCase();
  const { title, noise } = analyze(basename(r.rel, ext));
  if (!noise) continue;
  const slug = ALIASES[slugify(title)] ?? slugify(title);
  const loc = resolveProject(r.sub, r.rel);
  if (loc.collection === "demos" && slug && !songs.has(slug) && !needsAttention.some((n) => n.slug === slug))
    needsAttention.push({ kind: "orphan", slug, note: "only a click bounce exists — no master", src: r.rel });
}

// scores: keep only the selected set
const scoresKept = [];
const scoresDropped = [];
for (const f of scoreFiles) {
  const rule = SCORE_KEEP[f.project];
  if (rule && rule(f)) scoresKept.push(f);
  else scoresDropped.push(f);
}

// ─── print ───────────────────────────────────────────────────────────────────

const demoSongCount = [...projects.values()].reduce((n, p) => n + p.songs.length, 0);
const demoVerCount = [...projects.values()].reduce((n, p) => n + p.songs.reduce((m, s) => m + s.versions.length, 0), 0);
const placeholders = [...projects.values()].reduce((n, p) => n + p.songs.filter((s) => s.coverPlaceholder).length, 0);

console.log("");
console.log(c.bold("SOUNDS — grouping preview") + c.dim("  (read-only; FL masters + soundcloud layer)"));
console.log(c.dim(`source : FL ${SOURCE_ROOT.replace(homedir(), "~")}/{${SUBFOLDERS.join(", ")}}  +  ${SC_DIR}/`));
console.log(c.dim(`target : EP → ${OUT_ROOT}/demos/<ep>/<song>/<date>__<variant>.mp3   ·   single → ${OUT_ROOT}/demos/<song>/…`));
console.log(c.dim(`legend : ▲N = version stack · ☁ = soundcloud-sourced audio · ⬚? = cover placeholder · ▣ = real cover · ⚠ = untitled`));
console.log(c.dim(`summary: ${demoSongCount} demo songs (${demoVerCount} versions) · ${scoresKept.length} score items · ${placeholders} cover placeholders · ${needsAttention.length} need attention`));

const renderSong = (s) => {
  const stack = s.versions.length > 1 ? c.mag(`  ▲${s.versions.length}`) : "";
  const cover = s.coverPlaceholder ? c.yellow("  ⬚?") : c.green("  ▣");
  const tags = `${s.untitled ? c.yellow("  ⚠") : ""}${s.scOnly ? c.blue("  ☁only") : ""}`;
  console.log(`      ${c.bold(s.title)} ${c.dim(s.slug)}${stack}${cover}${tags}`);
  for (const v of s.versions) {
    const cloud = v.source === "soundcloud" ? c.blue(" ☁") : "";
    const where = v.source === "soundcloud" ? `${SC_DIR}/audio/${v.rel}` : `${v.sub}/${v.rel}`;
    console.log(`        ${c.green(v.date)}  ${v.variant.padEnd(13)} ${c.dim(fmtMB(v.size).padStart(7))}${cloud}  ${c.dim(where)}`);
  }
};

console.log("");
console.log(c.cyan("══ DEMOS"));
// EPs first — each its own grouping / dir
for (const proj of DEMO_PROJECT_ORDER.filter((p) => EP_PROJECTS.has(p))) {
  const p = projects.get(proj);
  if (!p) continue;
  console.log("");
  console.log(`  ${c.bold("▸ " + p.label)}  ${c.dim(`(${p.songs.length} songs · demos/${proj}/)`)}`);
  for (const s of p.songs) renderSong(s);
}
// everything else flat in demos/ — no wrapper
const flatSongs = [];
for (const [proj, p] of projects) if (!EP_PROJECTS.has(proj)) flatSongs.push(...p.songs);
flatSongs.sort((a, b) => b.latest.localeCompare(a.latest));
if (flatSongs.length) {
  console.log("");
  console.log(`  ${c.dim(`· ${flatSongs.length} singles, flat in demos/ (newest first) ·`)}`);
  for (const s of flatSongs) renderSong(s);
}

// SCORES
console.log("");
console.log(c.cyan("══ SCORES"));
const timecode = (name) => { const m = name.match(/(\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2}|null)/); return m ? `${m[1]}–${m[2]}` : name; };
const keptByProject = new Map();
for (const f of scoresKept) { if (!keptByProject.has(f.project)) keptByProject.set(f.project, []); keptByProject.get(f.project).push(f); }
for (const [proj, files] of keptByProject) {
  console.log("");
  if (proj === "hmbm") {
    console.log(`  ${c.bold("▸ HMBM")}  ${c.dim(`(film score — ${files.length} cues, in picture order)`)}`);
    for (const f of [...files].sort((a, b) => a.file.localeCompare(b.file))) console.log(`      ${c.green(timecode(f.file).padEnd(20))} ${c.dim(f.date)}  ${c.dim(f.sub + "/" + f.rel)}`);
  } else {
    console.log(`  ${c.bold("▸ " + proj)}  ${c.dim(`(${files.length} track${files.length === 1 ? "" : "s"})`)}`);
    for (const f of [...files].sort((a, b) => b.date.localeCompare(a.date))) console.log(`      ${c.green(f.date)}  ${c.bold(f.title)}  ${c.dim(f.sub + "/" + f.rel)}`);
  }
}

if (needsAttention.length) {
  console.log("");
  console.log(c.yellow("══ NEEDS ATTENTION"));
  for (const n of needsAttention) console.log(`  ${c.yellow(n.kind.padEnd(8))} ${c.bold(n.slug.padEnd(26))} ${n.note}`);
}

console.log("");
console.log(c.dim(`set aside: ${ignored.length} working files (clicks, dupes, stems) · ${scoresDropped.length} excluded from scores (foley, theme, My Friend Whil)`));
console.log("");
