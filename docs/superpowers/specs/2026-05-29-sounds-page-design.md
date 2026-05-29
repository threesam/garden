# /sounds — design spec

## Goal

Turn `/sounds` from a "coming soon" placeholder into a living archive of Sam's
music. Two collections — **demos** and **scores** — modeled from local FL Studio
WAV masters plus SoundCloud, where each song is a *stack of dated versions* so
the years-long evolution of a track is visible ("passionate processing in
real-time, captured"). Eventually the existing `eye ocean` sketch becomes an
audio-reactive backdrop driven by the playing track.

## Phasing (important — scope discipline)

- **Phase 1 — NOW.** Get the *function* correct, not the style.
  - Ingest pipeline (FL + SoundCloud → mp3 → folder layout + manifest).
  - `/sounds` route reads the manifest and renders a **simple, unstyled
    listing** with a basic `<audio>` element per version.
  - No sketch. No visual design. Verify the data flows end-to-end.
- **Phase 2 — LATER.** Audio-reactive `eye ocean` visualizer (design captured
  below so it isn't lost).
- **Phase 3 — LATER.** Styled player UI: cover grid, version-stack reveal,
  HMBM cue-sheet timeline.
- **Later.** Hosting (Vercel Blob), naming the two untitled tracks.

Do **not** build the sketch or styling in Phase 1.

## Content model (LOCKED)

Four levels: `collection → project → song → version`.

- **collection**: `demos` | `scores` — thematically distinct presentations.
- **project**: within `demos`, **EPs are their own dirs** (`404`, `fa11faster`);
  every other demo song is **flat** in `demos/` (no "early singles" wrapper).
  Within `scores`: `hmbm` and `sk+w`.
- **song**: identified by a canonical slug; **groups dated versions across
  folders and sources**. Placed in its newest version's project.
- **version**: one dated render. `variant` is a free label (`main`, `mixed`,
  `limited`, `instrumental`, `acoustic-guitar`, `raw`, …). Stacked newest-first.

### Sources

1. **FL Studio masters** — `~/Documents/Image-Line/FL Studio/Projects/{me, sk+w}`
   (recursive). Lossless WAV. The audio source of record.
2. **SoundCloud** (`soundcloud.com/threesam`), pulled into `sc-inventory/`:
   - **8 SC-only tracks** with no local master → become real songs. Their audio
     is lossy 128 kbps mp3 (the only copies that exist). Flagged as such.
   - **Metadata/cover layer** for the whole demo catalog: canonical titles +
     cover art + release dates.

### Grouping rules (the heuristic + manual overrides)

These live in code (`scripts/sounds-preview.mjs`, to become the ingest config):

- **Canonical slug** = slugify(title) after stripping a recognized variant
  suffix, then applying aliases.
- **Aliases** (same song, different working titles — heuristic can't infer):
  - `server error` → `identity theft is not a joke`
  - `make it obvious` → `obvious`
- **Exact-name dedup**: same folder + filename stem across extensions = one
  render exported twice → keep the most master-y (`wav > flac > mp3`).
- **Noise / set aside** (never published): click bounces (`with click`,
  `(NNbpm)`), `(audio only)`, `(consolidated)` stems.
- **Scores curation**: `hmbm` keeps only its timecoded **cues**; from `sk+w`
  keep only `polka-dot dress` + `quintessentially unaware`. Excluded: HMBM
  theme takes, the 12-clip foley library, `My Friend Whil`.
- **Covers**: a song's cover is its SoundCloud art, UNLESS that art is the
  avatar-default (an image hash shared by ≥3 tracks) or there's no SC match —
  then render the **`?` placeholder** (a question mark in `--coin` on a
  `--black` field).
- **Dates** = file creation date (birthtime) for FL, upload_date for SC-only.
  Baked into the output filename so it survives conversion.

### The catalog (as locked)

```
DEMOS — 26 songs / 38 versions
  ▸ 404 (EP) → demos/404/
      natural causes ▲3 · identity theft is not a joke ▲4 · silent ▲3
  ▸ fa11faster (EP) → demos/fa11faster/
      untitled_00 (⚠ untitled) · lilboots
  · 21 singles, flat in demos/ (newest first) ·
      greedy · yeah i'm hungry · nutcracker ▲3 · loading screen · untitled_0 (⚠) ·
      azaleas · koda · juni gets a song · grown · little die · christmas caroling 2022 (☁) ·
      free beach · obvious ▲3 · imposter syndrome ▲2 (☁) · the hey blinkins (☁) ·
      take your time (☁) · climate change (☁) · ladybug · the comedown ·
      stelliferous (☁) · where is phoenix's mind? (☁)
SCORES
  ▸ hmbm → scores/hmbm/ — 14 timecoded cues (00:10:04 → 01:20:12), picture order
  ▸ sk+w → scores/sk+w/ — quintessentially unaware · polka-dot dress
```

`☁` = SoundCloud-sourced (lossy 128k). `▲N` = N-version stack.
**7 cover placeholders**: `untitled_00`, `lilboots`, `untitled_0`, `greedy`,
`yeah i'm hungry`, `nutcracker`, `where is phoenix's mind?`.

## On-disk layout & manifest

```
static/audio/sounds/
  demos/<song-slug>/<YYYY-MM-DD>__<variant>.mp3          # flat single
  demos/404/<song-slug>/<YYYY-MM-DD>__<variant>.mp3       # EP
  demos/fa11faster/<song-slug>/...
  scores/hmbm/<HHMMSS-HHMMSS>.mp3                          # cue (timecode)
  scores/sk+w/<song-slug>/<YYYY-MM-DD>__<variant>.mp3
  manifest.json                                           # generated, committed
```

The folder + filenames are the durable source of truth. A mis-group is fixed by
moving/renaming a file, never by re-parsing FL names. Audio is **gitignored**
(local-first); only `manifest.json` is committed. (Consequence: a deployed build
has no audio until hosting is decided — acceptable per local-first.)

## Ingest pipeline — `scripts/sounds-ingest.mjs`

Evolves from the existing `scripts/sounds-preview.mjs` (whose grouping logic is
already the spec in runnable form). Re-runnable / idempotent.

1. Scan FL `{me, sk+w}` recursively + read `sc-inventory/` (metadata + SC-only
   audio + cover art).
2. Apply the locked rules → resolve collection / project / song / version /
   cover for every kept file.
3. **Encode** each FL WAV → mp3 (`ffmpeg`, ~192 kbps) into the layout above;
   copy SC-only mp3s as-is; copy/normalize cover art alongside.
   - `ffmpeg` is at `~/miniforge3/bin/ffmpeg`; pass an explicit path so it's
     found regardless of shell PATH.
4. Emit `manifest.json` matching the types below.
5. Log what was set aside / excluded / flagged (untitled, placeholder cover).

## Data types (manifest)

```ts
type CollectionId = "demos" | "scores";

interface Version {
  date: string;          // "2025-12-01"
  variant: string;       // "main" | "mixed" | "limited" | …
  src: string;           // "/audio/sounds/demos/404/silent/2025-03-23__mixed.mp3"
  source: "local" | "soundcloud";
  lossy: boolean;        // true for SoundCloud 128k
}

interface Song {
  slug: string;
  title: string;         // SoundCloud canonical title where available
  versions: Version[];   // newest first
  latest: string;        // newest version date (song sort key)
  cover: string | null;  // art path, or null → "?" placeholder
  untitled: boolean;
}

interface Project { id: string; label: string; isEP: boolean; songs: Song[]; }

interface Cue { timecode: string; start: number; src: string; date: string; }

interface SoundsManifest {
  demos: { eps: Project[]; singles: Song[] };
  scores: { hmbm: Cue[]; skw: Song[] };
}
```

## Route & rendering — Phase 1 (simple listing)

- `src/routes/sounds/+page.server.ts` — `export const prerender = true`; read
  `static/audio/sounds/manifest.json`, return `SoundsManifest`. (Mirrors the
  `/shelf` pattern: prerendered, reads a local source.)
- `src/routes/sounds/+page.svelte` — **unstyled, functional**:
  - EP sections (`404`, `fa11faster`), then flat singles (newest first), then
    scores (HMBM cue list + sk+w).
  - Each song: title, cover thumbnail or `?` placeholder, and its versions each
    with a plain `<audio controls>` (date + variant label).
  - No layout polish, no sketch, no custom player. Just prove the data + audio
    play correctly.

## Audio-reactive visualizer — Phase 2 (DEFERRED — design captured)

Make the existing `day25` "eye ocean" the visualizer. **Do not build in Phase 1.**

- A hidden `<audio>` drives playback → `AudioContext → MediaElementSource →
  AnalyserNode`. Per `rAF`, read a **3-band split** (bass / mid / treble) + amp.
- Extend `SketchAPI` with a live `audio` field `{ amp, bass, mid, treble }` the
  sketch host updates each frame; non-reactive sketches ignore it (the 30-day
  series is untouched). Build a **new `eye-ocean` reactive variant** with a
  `tick` — leave original `day25` pure.
- Mappings:
  - **bass → eye size** (the ocean breathes with the low end / kick).
  - **treble → noise-flow speed**: `t += baseFlow + treble * flowGain`, so the
    size-scatter (currently static `noise(x*0.025, y*0.025)`) gains a time axis
    and shimmers — `noise(x*0.025, y*0.025, t)`.
  - **mid → size spread** (min↔max contrast) and **transients → pupil dilation**
    (nice-to-have; dial to taste).
- **Idle (paused)**: `t` advances at a low `baseFlow` with a floor amplitude, so
  the field breathes gently — alive, never dead-static.
- Prior art: the retired Next.js `/signal` page had an `AudioReactiveProvider` +
  `MusicPlayer` + 12k-particle WebGL visualizer — reference, not reused.

## Open items (non-blocking)

- `untitled_0` and `untitled_00` need real titles (not on SoundCloud).
- `climate change` and the 7 other `☁` tracks are lossy-only (no master).
- Hosting: revisit Vercel Blob when the catalog audio needs to ship in prod.
