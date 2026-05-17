# SvelteKit migration — design

Date: 2026-05-17
Branch: `sveltekit-port` (worktree at `.worktrees/sveltekit-port`)

## Goal

Port `threesam` from Next.js 16 / React 19 to SvelteKit (Svelte 5 runes) on
Vercel adapter, with a leaner surface area, exact-pinned deps, no known CVEs,
visual parity on every kept route, and Lighthouse scores at least matching
the current site (which sits at 100 a11y / 100 best-practices / 100 SEO
across the board per commit `a36aba6`).

The win we want from the framework switch: real DOM updates without a vdom
diff, smaller hydration cost, simpler imperative wrappers for the
canvas-heavy components that don't benefit from React's render model.

## Scope

### Kept routes (port)

The site reduces to its actually-reachable surface — the Gallery on `/` is the
content discovery hub; anything not reachable from there (or from a Gallery
tile's destination) is treated as deprioritized and dropped.

- `/` — home (Gallery + CloudCanvas top/bottom)
- `/shelf` — Goodreads books
- `/sounds` — music
- `/thoughts` — text
- `/dad`, `/deana`, `/benny` — tribute pages (benny has playlists slider + 41-min video + WebVTT subtitles)
- `/anything-but-analog` — generative art index
- `/anything-but-analog/[slug]` — 31 sketches (from `lib/art/registry.ts`)
- `/canvas/self` — flatten the dynamic `[handle]` (only `self` was ever used)
- `/api/counters` — port 1:1 as `+server.ts`
- `/robots.txt`, `/sitemap.xml`, `/not-found`

### Routes dropped

- `/signal`, `/source`, `/resonance` — nav-only hubs with no inbound links
  from the Gallery. `/signal` is hollow once audio is dropped, `/resonance`
  is mostly links to case studies (also being deleted), `/source` has the
  step dashboard but is otherwise philosophy text.
- `/case-studies/cro-ecommerce-systems`
- `/case-studies/generative-art-experiments`
- `/case-studies/made-in-cookware`
- `/case-studies/sixtom`
- `/anything-but-analog/raw/[slug]`

### Nav

After dropping the three hubs, the nav reduces to:

- `threesam` → `/`
- `studio ↗` → `https://sixtom.com`

The brand framework (signal/source/resonance) lives in positioning and
memory, not as routes.

### Components / subsystems dropped

All of the following are orphaned by either (a) prior deprecation that left
them functionally inert or (b) dropping the three hub routes. Cut at the
filesystem level — nothing in the kept surface imports any of them:

- `components/audio/*` — audio-reactive pipeline. UI sets state, nothing
  visual reads it (visual consumers were all in the orphan `components/hero/*`).
- `components/hero/*` — generative-hero, hero-canvas, fractal-zoom-canvas,
  ascii-video-overlay, hero-sketch-carousel. Already orphaned before this PR.
- `components/sections/*` — bio-section, discipline-section, music-section,
  work-section. Only signal/source/resonance imported these.
- `components/portfolio/work-card.tsx` — only `/resonance` used it.
- `components/fitness/step-dashboard.tsx` — only `/source` used it.
- `lib/steps.ts`, `data/steps.mock.json`, `types/fitness.ts` — only the step
  dashboard used them.

## Architecture

### Project layout

```
/                         project root (single repo, replaces Next layout)
├── src/
│   ├── app.html          shell template
│   ├── app.css           Tailwind v4 entry
│   ├── app.d.ts          ambient types
│   ├── lib/
│   │   ├── components/   reusable .svelte components (Nav, Prose, Video, LazyMount, frame, ascii, canvas, gallery, banners)
│   │   ├── art/          sketches + registry (TS, framework-agnostic — copied as-is)
│   │   ├── content/      markdown loaders (unchanged from current lib/content.ts)
│   │   ├── server/       counter-store, content readers
│   │   ├── wasm/         garden-math loader (unchanged)
│   │   ├── seo.ts        metadata helpers
│   │   └── ...           dominant-color, perf-flags, goodreads
│   └── routes/
│       ├── +layout.svelte           shell with Nav
│       ├── +layout.ts               (if needed for global load)
│       ├── +page.svelte             home
│       ├── shelf/+page.svelte
│       ├── sounds/+page.svelte
│       ├── thoughts/+page.svelte
│       ├── dad/+page.svelte
│       ├── deana/+page.svelte
│       ├── benny/+page.svelte
│       ├── anything-but-analog/
│       │   ├── +page.svelte
│       │   └── [slug]/+page.svelte
│       ├── canvas/
│       │   └── self/+page.svelte
│       ├── api/
│       │   └── counters/+server.ts
│       ├── sitemap.xml/+server.ts
│       ├── robots.txt/+server.ts
│       └── +error.svelte
├── static/                public assets (copied from current public/)
├── rust/                  unchanged
├── content/               unchanged (markdown)
├── data/                  counters.json (unchanged shape)
├── tests/
│   ├── playwright.config.ts
│   ├── routes.spec.ts     smoke (status + key text)
│   └── visual.spec.ts     screenshot diffs vs Next baseline
├── svelte.config.js
├── vite.config.ts
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

### Framework decisions

- **Adapter**: `@sveltejs/adapter-vercel` on Fluid Compute (Node runtime). No edge runtime — the counter store uses `node:fs` and Tailwind v4 is happier under Node anyway.
- **Svelte 5 with runes** (`$state`, `$derived`, `$effect`, `$props`). No legacy stores.
- **Vite** (built in to SvelteKit).
- **TypeScript** strict, matching current `tsconfig.json`.
- **Tailwind v4** via `@tailwindcss/postcss` — same setup as today.
- **CSS approach**: Keep the existing utility-first approach; lift shared classes to `app.css` `@layer` blocks where they're already reused (`section-shell`, `copy-lower`).

### Canvas / imperative components — porting pattern

React's pattern (mount → useEffect → ref → attach handlers → cleanup) maps
1:1 to a Svelte action:

```svelte
<script lang="ts">
  import { voronoiCanvas } from '$lib/components/canvas/actions/voronoi';
  let { handle } = $props();
</script>

<canvas use:voronoiCanvas={{ handle }} class="..."></canvas>
```

```ts
// $lib/components/canvas/actions/voronoi.ts
export function voronoiCanvas(node: HTMLCanvasElement, params: VoronoiParams) {
  const ctx = node.getContext('2d')!;
  let raf = 0;
  const loop = () => { /* draw */ raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return {
    update(next: VoronoiParams) { /* sync */ },
    destroy() { cancelAnimationFrame(raf); }
  };
}
```

All the existing drawing logic (`drawVoronoi`, three.js scene setup, etc.) is
plain TS already — it gets copied unchanged. Only the lifecycle shell changes.

### Sketches

The 31 sketches in `lib/art/sketches/*.ts` are pure functions (`draw(ctx, t, opts)`)
plus metadata. They're framework-agnostic — copy them and the registry as-is to
`src/lib/art/`. The `SketchHost` React component becomes a Svelte action.

### Markdown / content

`lib/content.ts` reads markdown via `marked` and `fast-xml-parser`. Server-side
loaders in SvelteKit are `+page.server.ts` — port the content readers there.
This keeps content rendering on the server (no client-side markdown parsing).

### Metadata / SEO

Next's `export const metadata` becomes a per-page `+page.ts` `load` returning
metadata, consumed by `+layout.svelte` rendering `<svelte:head>`. The
`SITE_URL`, OG defaults, JSON-LD helpers in `lib/seo.ts` stay; only the
emission site changes.

Sitemap and robots become `+server.ts` endpoints returning text/xml with the
right Content-Type.

### API: counters

`app/api/counters/route.ts` → `src/routes/api/counters/+server.ts`. Same
`lib/server/counter-store.ts` logic (file-based). Same `GET` returns current
counters, `POST` increments — same JSON shape.

Known constraint preserved as-is: Vercel's filesystem is ephemeral, so
counters reset per cold start. This was already true on Next; the port
doesn't fix it (out of scope).

### WASM

`public/wasm/garden_math.wasm` → `static/wasm/garden_math.wasm`. The
`lib/wasm/garden-math.ts` loader fetches by path and is framework-agnostic —
move it under `src/lib/wasm/`.

### Charts

`chart.js` is already framework-agnostic; the existing React wrappers in
`components/messages/*` become Svelte actions that call `new Chart(node, config)`
on mount and `chart.destroy()` on teardown. No `react-chartjs-2` dep was used,
so nothing to swap.

## Dependencies

Drop:
- `next`, `react`, `react-dom`, `eslint-config-next`, `@types/react`, `@types/react-dom`
- `canvas` — verify no consumer survives the port; if any sketch needs it for SSR rendering, keep. Default to drop.

Add (exact-pinned per CLAUDE.md, no `^` or `~`):
- `@sveltejs/kit` (latest)
- `@sveltejs/adapter-vercel` (latest)
- `@sveltejs/vite-plugin-svelte` (latest)
- `svelte` (5.x latest)
- `vite` (latest compatible with kit)
- `@playwright/test` (latest, devDep)
- `vitest` (latest, devDep) — only added if we end up writing pure unit tests; otherwise omit

Keep (already framework-agnostic — verify each still exact-pinned):
- `chart.js`, `d3-cloud`, `@types/d3-cloud`, `three`, `@types/three`, `marked`, `marked-emoji`, `node-emoji`, `fast-xml-parser`, `sharp`, `tailwindcss`, `@tailwindcss/postcss`, `typescript`, `@types/node`, `eslint`

Pin policy: re-pin every dependency to the exact resolved version from the
lockfile (use `--save-exact` / `save-exact=true` in `.npmrc`). Strip any
remaining carets/tildes.

CVE policy: `npm audit --omit=dev` must report zero high/critical. Highs in
dev deps get triaged case-by-case in the PR.

## Testing

Two layers, both Playwright (one tool, one config):

### Smoke (`tests/routes.spec.ts`)
For every kept route, assert:
- HTTP 200 on first navigation
- A route-distinct text marker is visible (e.g. "shelf" h1 on /shelf, sketch title on a sample sketch route)
- No console errors during initial render

### Visual diff (`tests/visual.spec.ts`)
- **Baseline capture step** runs first against the *current* Next build
  inside the worktree (`npm run build && npm start`) and saves screenshots to
  `tests/__screenshots__/baseline/`. This runs before the scaffold step
  wipes `app/`, so we have an immutable reference of the current site's
  *kept* routes — dropped routes are not captured.
- After the port, the same spec runs against the SvelteKit build and
  compares each route's screenshot to the baseline with Playwright's
  `toHaveScreenshot` (tolerance: small, e.g. `maxDiffPixelRatio: 0.005`,
  default animation handling = disabled).
- Routes covered: `/`, `/shelf`, `/sounds`, `/thoughts`, `/dad`, `/deana`,
  `/benny`, `/anything-but-analog`, `/anything-but-analog/<first-sketch-slug>`,
  `/canvas/self`.
- Viewports: one mobile (375×812), one desktop (1280×800).
- Canvas routes screenshot the layout chrome and a `prefers-reduced-motion`
  snapshot of the canvas (with the sketch's seeded RNG); pure pixel diffs
  on animated canvases will always drift, so for those we assert layout
  parity around the canvas instead of exact pixels.

### Out of scope for this PR
- Vitest unit tests for `lib/` pure functions. (Can follow up if useful.)
- E2E flows beyond first-render smoke.

## Lighthouse plan

Run Lighthouse from CLI against a local `vite preview` build (production
artifacts):

1. Run baseline on current `main` (Next), record numbers per route in PR.
2. Run on SvelteKit build, record numbers per route.
3. Targets:
   - Performance: improve or hold.
   - Accessibility: 100 (current).
   - Best Practices: 100 (current).
   - SEO: 100 (current).
4. If any route regresses, fix before merge. Common culprits to watch:
   - Font loading (`<link rel="preconnect">`, `font-display: swap`)
   - Image sizes (`<img>` width/height attributes — Svelte doesn't have
     `next/image`; use `static/` images with explicit dimensions and
     `loading="lazy"` for offscreen)
   - JS bundle per route (SvelteKit splits per route by default — should be
     better than Next's RSC bundles for our case)

## Execution order

Each phase ends with a commit. The PR is opened only after all phases pass.

1. **Worktree + baseline** — create `.worktrees/sveltekit-port`, branch
   `sveltekit-port`, build current Next, run Playwright baseline capture,
   commit baseline screenshots and Playwright config on the new branch.
2. **Scaffold** — wipe `app/`, `next.config.ts`, Next deps; init SvelteKit
   with Tailwind v4 and adapter-vercel; commit.
3. **Shell** — `+layout.svelte`, `Nav.svelte`, `app.css`, fonts, sitemap,
   robots, error page, SEO helpers; commit.
4. **Text/markdown routes** — home, shelf, sounds, thoughts, dad,
   deana (text), benny (text); commit.
5. **Canvas / three / ascii / sketches** — port actions and components;
   commit.
6. **Anything-but-analog + canvas/[handle] + API** — dynamic routes and
   counter endpoint; commit.
7. **Verify dropped surface is gone** — confirm `app/` removal already
   eliminated the dropped routes (signal/source/resonance/case-studies/raw),
   and that no stray imports remain. Also delete from `components/` and
   `lib/`: `audio/`, `hero/`, `sections/`, `portfolio/work-card.tsx`,
   `fitness/step-dashboard.tsx`, `lib/steps.ts`, `data/steps.mock.json`,
   `types/fitness.ts`; commit.
8. **Visual diff + smoke** — run tests, iterate until passing.
9. **Lighthouse** — measure, fix regressions.
10. **Pin + CVE** — final dep sweep.
11. **Recursive `/simplify` + `/code-review:code-review`** — loop until
    both report no findings.
12. **Push, open PR** — title: "port: Next.js → SvelteKit (Svelte 5 runes)".

## Out of scope

- Counter persistence beyond ephemeral filesystem.
- New routes, new features, or design changes.
- The `/vibe` page (not in current code — memory was stale, will be cleaned
  up separately).
- Vitest unit tests.
- Multi-PR phasing — this is one PR per scope decision.
