import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, canon } from "./grouping.mjs";

const fl = (sub, rel, date, size = 1000) => {
  const ext = rel.slice(rel.lastIndexOf("."));
  const stem = rel.slice(rel.lastIndexOf("/") + 1, -ext.length).toLowerCase();
  const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : ".";
  return { sub, rel, ext, stem, dir, size, date, abs: `/fake/${sub}/${rel}` };
};

test("canon applies aliases", () => {
  assert.equal(canon("server_error"), "identity-theft-is-not-a-joke");
  assert.equal(canon("make it obvious - acoustic"), "obvious");
});

test("EP songs land in their EP; flat songs go to singles", () => {
  const flFiles = [
    fl("me", "actually trying/the way/silent_mixed.wav", "2025-03-23"),
    fl("me", "silent.wav", "2022-11-22"),
    fl("me", "koda.wav", "2023-04-02"),
  ];
  const { manifest } = buildCatalog({ flFiles, scTracks: [] });
  const ep404 = manifest.demos.eps.find((e) => e.id === "404");
  assert.ok(ep404, "404 EP exists");
  const silent = ep404.songs.find((s) => s.slug === "silent");
  assert.equal(silent.versions.length, 2, "silent stacks the 2022 take under the EP mix");
  assert.equal(silent.versions[0].variant, "mixed", "newest first");
  assert.ok(manifest.demos.singles.some((s) => s.slug === "koda"), "koda is a flat single");
});

test("wav wins over mp3 of same stem; click bounce ignored", () => {
  const flFiles = [
    fl("me", "obvious.wav", "2022-11-30"),
    fl("me", "obvious.mp3", "2022-11-30"),
    fl("me", "obvious - with click (69bpm).mp3", "2022-12-01"),
  ];
  const { manifest, flags } = buildCatalog({ flFiles, scTracks: [] });
  const obvious = manifest.demos.singles.find((s) => s.slug === "obvious");
  assert.equal(obvious.versions.length, 1, "one render kept");
  assert.equal(obvious.versions[0].src.endsWith(".mp3"), true);
  assert.ok(flags.ignored.some((i) => /click/.test(i.reason)), "click bounce set aside");
});

test("soundcloud-only track becomes a lossy single with a cover", () => {
  const scTracks = [{ id: "1", title: "stelliferous", cleanTitle: "stelliferous", variant: "main", slug: "stelliferous", date: "2022-10-13", artPath: "/fake/art/stell.jpg", isDefaultArt: false, audioPath: "/fake/sc/stell.mp3", size: 5000 }];
  const { manifest } = buildCatalog({ flFiles: [], scTracks });
  const s = manifest.demos.singles.find((x) => x.slug === "stelliferous");
  assert.ok(s, "SC-only song present");
  assert.equal(s.versions[0].source, "soundcloud");
  assert.equal(s.versions[0].lossy, true);
  assert.equal(s.cover, "/audio/sounds/covers/stelliferous.jpg");
});

test("default (avatar) cover → placeholder (cover null)", () => {
  const scTracks = [{ id: "2", title: "greedy", cleanTitle: "greedy", variant: "main", slug: "greedy", date: "2024-05-27", artPath: "/fake/art/default.jpg", isDefaultArt: true, audioPath: null, size: 0 }];
  const flFiles = [fl("me", "greedy.wav", "2024-05-27")];
  const { manifest, flags } = buildCatalog({ flFiles, scTracks });
  const g = manifest.demos.singles.find((x) => x.slug === "greedy");
  assert.equal(g.cover, null);
  assert.ok(flags.placeholders.includes("greedy"));
});

test("scores: hmbm cues in picture order; only selected sk+w kept", () => {
  const flFiles = [
    fl("sk+w", "hmbm/hmbm__00:30:36-00:32:26.wav", "2024-12-29"),
    fl("sk+w", "hmbm/hmbm__00:10:04-00:11:00.wav", "2024-09-19"),
    fl("sk+w", "hmbm - foley/deana.wav", "2023-09-16"),
    fl("sk+w", "polka-dot dress.wav", "2023-05-30"),
    fl("sk+w", "My Friend Whil.wav", "2023-05-25"),
  ];
  const { manifest, flags } = buildCatalog({ flFiles, scTracks: [] });
  assert.equal(manifest.scores.hmbm.length, 2, "two cues kept");
  assert.equal(manifest.scores.hmbm[0].start < manifest.scores.hmbm[1].start, true, "ascending timecode");
  assert.deepEqual(manifest.scores.skw.map((s) => s.slug), ["polka-dot-dress"]);
  assert.ok(flags.excluded.some((p) => /foley/.test(p)), "foley excluded");
  assert.ok(flags.excluded.some((p) => /My Friend Whil/.test(p)), "My Friend Whil excluded");
});

test("cues that share a start time get distinct filenames", () => {
  const flFiles = [
    fl("sk+w", "hmbm/hmbm__00:34:34-00:35:08.wav", "2025-01-25"),
    fl("sk+w", "hmbm/hmbm__00:34:34-00:35:08 - Part_1.wav", "2025-01-26"),
  ];
  const { manifest } = buildCatalog({ flFiles, scTracks: [] });
  const srcs = manifest.scores.hmbm.map((c) => c.src);
  assert.equal(new Set(srcs).size, 2, "no filename collision for same-start cues");
});

test("two versions sharing date+variant get distinct srcs (no overwrite)", () => {
  const flFiles = [
    fl("me", "silent.wav", "2022-11-22"),
    fl("me", "actually trying/the way/silent.wav", "2022-11-22"), // same slug+date+variant, different folder
  ];
  const { manifest, conversions } = buildCatalog({ flFiles, scTracks: [] });
  const all = [...manifest.demos.eps.flatMap((e) => e.songs), ...manifest.demos.singles];
  const silent = all.find((s) => s.slug === "silent");
  assert.equal(silent.versions.length, 2);
  assert.equal(new Set(silent.versions.map((v) => v.src)).size, 2, "version srcs unique");
  assert.equal(new Set(conversions.map((c) => c.to)).size, conversions.length, "no two conversions write the same path");
});

test("a file named only after a variant word keeps a non-empty slug", () => {
  const { manifest } = buildCatalog({ flFiles: [fl("me", "raw.wav", "2023-01-01")], scTracks: [] });
  const s = manifest.demos.singles.find((x) => x.slug === "raw");
  assert.ok(s, "slug falls back to the stem instead of collapsing to empty");
  assert.ok(!s.versions[0].src.includes("//"), "no double-slash in path");
});
