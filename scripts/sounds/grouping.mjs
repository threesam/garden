// scripts/sounds/grouping.mjs — pure grouping logic for the /sounds catalog.
// No I/O. Shared by ingest.mjs; unit-tested by grouping.test.mjs.
//
// The rules here are the locked content model (see
// docs/superpowers/specs/2026-05-29-sounds-page-design.md). A mis-group is
// fixed by editing these rules, never downstream.
//
// Public surface: AUDIO_EXTS, DEFAULT_ART_MIN, analyze, canon, buildCatalog.
// Everything else is module-internal.

export const AUDIO_EXTS = new Set([".wav", ".flac", ".mp3", ".aiff", ".aif"]);
const EXT_RANK = { ".wav": 0, ".flac": 1, ".aiff": 2, ".aif": 2, ".mp3": 3 };
export const DEFAULT_ART_MIN = 3; // an art hash shared by ≥ this many tracks = avatar default
const EP_PROJECTS = new Set(["404", "fa11faster"]);

// Files matching a NOISE rule are set aside, never published.
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
const aliasSlug = (s) => ALIASES[s] ?? s; // single source of alias resolution

// Scores: which files survive curation.
const SCORE_KEEP = {
  hmbm: (rec) => rec.kind === "cue",
  "sk+w": (rec) => ["polka-dot-dress", "quintessentially-unaware"].includes(rec.slug),
};

const slugify = (s) =>
  s.toLowerCase().replace(/['’`]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function analyze(nameNoExt) {
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

// Canonical song slug for matching across sources (FL + soundcloud).
export const canon = (title) => aliasSlug(slugify(analyze(title).title));

function resolveProject(sub, rel) {
  const file = rel.split("/").pop();
  if (sub === "me") {
    if (rel.startsWith("actually trying/the way/")) return { collection: "demos", project: "404", label: "404" };
    if (rel.startsWith("actually trying/fa11faster/")) return { collection: "demos", project: "fa11faster", label: "fa11faster" };
    if (rel.startsWith("actually trying/")) return { collection: "demos", project: "404", label: "404" };
    if (/^hmbm\b/i.test(file)) return { collection: "scores", project: "hmbm", label: "hmbm" };
    return { collection: "demos", project: "early", label: "early singles" };
  }
  if (sub === "sk+w") {
    if (rel.startsWith("hmbm - foley/")) return { collection: "scores", project: "hmbm", label: "hmbm" };
    if (rel.startsWith("hmbm/")) return { collection: "scores", project: "hmbm", label: "hmbm" };
    return { collection: "scores", project: "sk+w", label: "sk+w" };
  }
  return { collection: "demos", project: "early", label: "early singles" };
}

function scoreKind(rel, file) {
  if (rel.includes("hmbm - foley/")) return "foley";
  if (/\d{1,2}:\d{2}:\d{2}/.test(file)) return "cue";
  if (/^hmbm\b/i.test(file)) return "theme";
  return "track";
}

// Same folder + filename stem across extensions = one render exported twice.
// Keep the most master-y (wav > flac > mp3). files: [{sub,rel,ext,stem,dir,…}]
function dedupeByStem(files) {
  const byStem = new Map();
  const dropped = [];
  for (const r of files) {
    const k = `${r.sub}/${r.dir}/${r.stem}`;
    const cur = byStem.get(k);
    if (!cur) { byStem.set(k, r); continue; }
    const keep = EXT_RANK[r.ext] < EXT_RANK[cur.ext] ? r : cur;
    const drop = keep === r ? cur : r;
    dropped.push({ reason: `duplicate export (kept ${keep.ext})`, file: drop });
    byStem.set(k, keep);
  }
  return { kept: [...byStem.values()], dropped };
}

// Build the manifest + a conversion plan from already-read descriptors.
//   flFiles:  [{ sub, rel, ext, stem, dir, date, abs }]
//   scTracks: [{ id, title, cleanTitle, variant, slug, date, artPath, isDefaultArt, audioPath }]
// Returns { manifest, conversions, covers, flags }.
export function buildCatalog({ flFiles, scTracks }) {
  const ignored = [];

  const { kept, dropped } = dedupeByStem(flFiles);
  ignored.push(...dropped.map((d) => ({ reason: d.reason, path: `${d.file.sub}/${d.file.rel}` })));

  const demoFiles = [];
  const scoreFiles = [];
  for (const r of kept) {
    const file = r.rel.split("/").pop();
    const a = analyze(file.replace(/\.[^.]+$/, ""));
    if (a.noise) { ignored.push({ reason: a.noise, path: `${r.sub}/${r.rel}` }); continue; }
    const loc = resolveProject(r.sub, r.rel);
    const rec = { ...r, file, title: a.title, variant: a.variant, slug: aliasSlug(slugify(a.title)), ...loc, source: "local" };
    if (loc.collection === "scores") scoreFiles.push({ ...rec, kind: scoreKind(r.rel, file) });
    else demoFiles.push(rec);
  }

  const scByCanon = new Map();
  for (const t of scTracks) { if (!scByCanon.has(t.slug)) scByCanon.set(t.slug, []); scByCanon.get(t.slug).push(t); }

  const songMap = new Map();
  for (const r of demoFiles) {
    if (!songMap.has(r.slug)) songMap.set(r.slug, { slug: r.slug, versions: [] });
    songMap.get(r.slug).versions.push(r);
  }
  for (const [slug, list] of scByCanon) {
    if (songMap.has(slug)) continue; // local master wins; SC is just metadata here
    const withAudio = list.filter((t) => t.audioPath);
    if (!withAudio.length) continue;
    songMap.set(slug, {
      slug,
      versions: withAudio.map((t) => ({ source: "soundcloud", date: t.date, variant: t.variant, project: "", audioPath: t.audioPath })),
    });
  }

  const conversions = [];
  const covers = [];
  const eps = new Map();
  const singles = [];
  const flags = { untitled: [], placeholders: [] };

  for (const song of songMap.values()) {
    song.versions.sort((a, b) => b.date.localeCompare(a.date));
    const newest = song.versions[0];
    const project = newest.project;
    const isEP = EP_PROJECTS.has(project);

    const matches = scByCanon.get(song.slug) || [];
    const primary = matches.find((t) => t.variant === "main") || matches.find((t) => !t.isDefaultArt) || matches[0];
    const title = primary?.cleanTitle || newest.title || song.slug;
    const coverTrack = matches.find((t) => !t.isDefaultArt) || null;
    const untitled = song.slug.startsWith("untitled");

    const dir = isEP ? `demos/${project}/${song.slug}` : `demos/${song.slug}`;
    const versions = song.versions.map((v) => {
      const file = `${v.date}__${v.variant}.mp3`;
      const url = `/audio/sounds/${dir}/${file}`;
      conversions.push({ from: v.source === "soundcloud" ? v.audioPath : v.abs, to: `static${url}`, copy: v.source === "soundcloud" });
      return { date: v.date, variant: v.variant, src: url, source: v.source, lossy: v.source === "soundcloud" };
    });

    let cover = null;
    if (coverTrack) {
      const coverUrl = `/audio/sounds/covers/${song.slug}.jpg`;
      covers.push({ from: coverTrack.artPath, to: `static${coverUrl}` });
      cover = coverUrl;
    } else {
      flags.placeholders.push(song.slug);
    }
    if (untitled) flags.untitled.push(song.slug);

    const out = { slug: song.slug, title, versions, latest: newest.date, cover, untitled };
    if (isEP) {
      if (!eps.has(project)) eps.set(project, { id: project, label: project, songs: [] });
      eps.get(project).songs.push(out);
    } else {
      singles.push(out);
    }
  }

  for (const ep of eps.values()) ep.songs.sort((a, b) => b.latest.localeCompare(a.latest));
  const epList = [...eps.values()].sort((a, b) => (a.id === "404" ? -1 : 1));
  singles.sort((a, b) => b.latest.localeCompare(a.latest));

  const excluded = [];
  const hmbm = [];
  const skw = [];
  for (const f of scoreFiles) {
    const keep = SCORE_KEEP[f.project]?.(f) ?? false;
    if (!keep) { excluded.push(`${f.sub}/${f.rel}`); continue; }
    if (f.project === "hmbm") {
      const m = f.file.match(/(\d{2}):(\d{2}):(\d{2})\s*-\s*(\d{2}:\d{2}:\d{2}|null)/);
      const start = m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : 0;
      const timecode = m ? `${m[1]}:${m[2]}:${m[3]}–${m[4]}` : f.file;
      // unique per-cue filename (two cues can share a start time, e.g. "… - Part_1")
      const cueSlug = f.file.replace(/\.[^.]+$/, "").replace(/^hmbm__/i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
      const url = `/audio/sounds/scores/hmbm/${cueSlug}.mp3`;
      conversions.push({ from: f.abs, to: `static${url}`, copy: false });
      hmbm.push({ timecode, start, src: url, date: f.date });
    } else {
      const url = `/audio/sounds/scores/skw/${f.slug}/${f.date}__${f.variant}.mp3`;
      conversions.push({ from: f.abs, to: `static${url}`, copy: false });
      skw.push({ slug: f.slug, title: f.title, versions: [{ date: f.date, variant: f.variant, src: url, source: "local", lossy: false }], latest: f.date, cover: null, untitled: false });
    }
  }
  hmbm.sort((a, b) => a.start - b.start);
  skw.sort((a, b) => b.latest.localeCompare(a.latest));

  const manifest = { demos: { eps: epList, singles }, scores: { hmbm, skw } };
  return { manifest, conversions, covers, flags: { ...flags, ignored, excluded } };
}
