# SvelteKit Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `threesam` from Next.js 16 / React 19 to SvelteKit (Svelte 5 runes) on adapter-vercel, with a leaner surface area, exact-pinned deps, no high/critical CVEs on prod deps, visual parity, and Lighthouse scores at least matching the current site.

**Architecture:** SvelteKit project at the repo root, replacing the existing Next.js layout. Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$props`). Tailwind v4 unchanged. Imperative DOM/canvas logic wrapped in Svelte actions. Server-side markdown loaders. WASM and Rust unchanged.

**Tech Stack:** SvelteKit · Svelte 5 · TypeScript (strict) · Vite · Tailwind v4 · `@sveltejs/adapter-vercel` (Node, Fluid Compute) · Playwright (smoke + visual diff) · `chart.js` · `three` · `marked` · WASM via Rust

**Spec:** `docs/superpowers/specs/2026-05-17-sveltekit-migration-design.md`

---

## Branch & worktree

All work in `.worktrees/sveltekit-port` on branch `sveltekit-port`. The spec is already committed on `main`.

## Phasing summary

| Phase | What | Verification |
|---|---|---|
| 0 | Worktree | `git worktree list` shows branch |
| 1 | Playwright baseline on Next | screenshots committed |
| 2 | Scaffold SvelteKit | `pnpm dev` serves blank page |
| 3 | Shell (layout, nav, fonts, SEO, sitemap, robots, error) | dev server renders shell |
| 4 | Text routes (shelf, sounds, thoughts, dad, deana text, benny text) | each route 200 + content visible |
| 5 | Canvas/three/ascii components | components render in their host routes |
| 6 | Home (Gallery + CloudCanvas) + anything-but-analog index + [slug] + 31 sketches | sketches render, gallery animates |
| 7 | /canvas/self (voronoi) + /api/counters | route renders, GET/POST work |
| 8 | Delete orphan dirs (audio/, hero/, sections/, etc.) | grep confirms no orphan imports |
| 9 | Visual diff + smoke pass | Playwright green |
| 10 | Lighthouse parity | scores ≥ baseline on all kept routes |
| 11 | Pin exact + CVE audit | `npm audit` clean on prod; no `^`/`~` |
| 12 | Recursive `/simplify` + `/code-review:code-review` | both pass clean |
| 13 | Open PR | URL returned |

---

# Phase 0 — Worktree

### Task 0.1: Create the worktree

**Files:** none

- [ ] **Step 1: Create branch + worktree**

```bash
cd /Users/salvatoredangelo/Code/Me/garden
git worktree add .worktrees/sveltekit-port -b sveltekit-port main
```

- [ ] **Step 2: Verify**

```bash
git worktree list
```

Expected output includes a line like:
```
.../garden/.worktrees/sveltekit-port  <sha>  [sveltekit-port]
```

- [ ] **Step 3: Switch working directory for the remainder of the plan**

All subsequent paths are relative to `.worktrees/sveltekit-port`. Stay in that directory for every step until Phase 13.

```bash
cd .worktrees/sveltekit-port
```

---

# Phase 1 — Playwright baseline on the current Next.js build

The baseline must be captured against the *current* Next app before any scaffolding changes happen, because we use it as the visual diff reference for the entire port.

### Task 1.1: Install Playwright in the worktree

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install**

```bash
pnpm add -D --save-exact @playwright/test
pnpm exec playwright install chromium --with-deps
```

Verify `package.json` shows `"@playwright/test": "1.x.y"` with no `^`.

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.005 } },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  ],
});
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml playwright.config.ts
git commit -m "test: add Playwright for baseline + visual diffs"
```

### Task 1.2: Write the visual-diff spec

**Files:**
- Create: `tests/visual.spec.ts`
- Create: `tests/routes.ts`

- [ ] **Step 1: Write the kept-routes list**

```ts
// tests/routes.ts
export const KEPT_ROUTES = [
  { path: '/',                              label: 'home' },
  { path: '/shelf',                         label: 'shelf' },
  { path: '/sounds',                        label: 'sounds' },
  { path: '/thoughts',                      label: 'thoughts' },
  { path: '/dad',                           label: 'dad' },
  { path: '/deana',                         label: 'deana' },
  { path: '/benny',                         label: 'benny' },
  { path: '/anything-but-analog',           label: 'aba-index' },
  { path: '/canvas/self',                   label: 'canvas-self' },
];

// The first visible sketch slug, used for /anything-but-analog/[slug] coverage.
// Resolved at test time from a fetched JSON dump of the registry to avoid
// hardcoding here.
```

- [ ] **Step 2: Write the visual diff spec**

```ts
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

test.describe('visual parity', () => {
  for (const { path, label } of KEPT_ROUTES) {
    test(`${label} ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      // Pause anything with CSS animations so screenshots are deterministic.
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });
      await page.waitForTimeout(400); // settle layout + any LCP
      await expect(page).toHaveScreenshot(`${label}.png`, { fullPage: true });
    });
  }

  test('aba-first-sketch /anything-but-analog/<first>', async ({ page, request }) => {
    // Hit a hidden endpoint that returns the first visible sketch slug.
    // Created in Phase 6, lives at /api/debug/first-sketch. For the
    // baseline run on Next, we instead read the registry directly by
    // loading the index page and clicking the first tile.
    await page.goto('/anything-but-analog', { waitUntil: 'networkidle' });
    const firstHref = await page.locator('a[href^="/anything-but-analog/"]').first().getAttribute('href');
    if (!firstHref) throw new Error('no sketch link on index');
    await page.goto(firstHref, { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
    });
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('aba-sketch.png', { fullPage: true });
  });
});
```

### Task 1.3: Write the smoke spec

**Files:**
- Create: `tests/routes.spec.ts`

- [ ] **Step 1: Write the smoke spec**

```ts
// tests/routes.spec.ts
import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

const ROUTE_MARKERS: Record<string, string> = {
  '/':                              'threesam',
  '/shelf':                         'shelf',
  '/sounds':                        'sounds',
  '/thoughts':                      'thoughts',
  '/dad':                           'dad',
  '/deana':                         'deana',
  '/benny':                         'benny',
  '/anything-but-analog':           'anything but analog',
  '/canvas/self':                   'self',
};

test.describe('smoke', () => {
  for (const { path } of KEPT_ROUTES) {
    test(`200 + marker visible: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      const resp = await page.goto(path);
      expect(resp?.status()).toBe(200);
      const marker = ROUTE_MARKERS[path];
      if (marker) await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
      expect(errors, `console errors on ${path}: ${errors.join('\n')}`).toEqual([]);
    });
  }
});
```

### Task 1.4: Run the baseline against the current Next build

- [ ] **Step 1: Build + start Next in background**

```bash
pnpm run build
pnpm start &
NEXT_PID=$!
sleep 5
curl -sf http://localhost:3000/ > /dev/null
```

If the curl fails, wait longer and retry.

- [ ] **Step 2: Capture baseline screenshots**

```bash
pnpm exec playwright test tests/visual.spec.ts --update-snapshots
```

This writes screenshots under `tests/visual.spec.ts-snapshots/`.

- [ ] **Step 3: Run smoke once against Next to validate the smoke spec itself**

```bash
pnpm exec playwright test tests/routes.spec.ts
```

Expected: all green. If the home page marker test fails because "threesam" doesn't appear visibly on `/`, update `ROUTE_MARKERS['/']` to a string that actually appears (check the Gallery render).

- [ ] **Step 4: Stop Next**

```bash
kill $NEXT_PID
wait $NEXT_PID 2>/dev/null || true
```

- [ ] **Step 5: Commit baseline**

```bash
git add tests/ playwright.config.ts
git commit -m "test: capture Next.js visual baseline + smoke"
```

---

# Phase 2 — Scaffold SvelteKit

### Task 2.1: Inventory then wipe Next-specific files

**Files:** delete listed below; rest stays for now (we'll move things into `src/` later).

- [ ] **Step 1: Delete Next-specific roots**

```bash
rm -rf app .next next-env.d.ts next.config.ts eslint.config.mjs postcss.config.mjs
rm -rf node_modules pnpm-lock.yaml package-lock.json
```

We will not commit this state — it's a transient transition. The next task installs fresh.

### Task 2.2: Initialize SvelteKit + adapter-vercel

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.npmrc`, `src/app.html`, `src/app.d.ts`, `src/app.css`, `src/routes/+page.svelte`, `src/routes/+layout.svelte`, `postcss.config.mjs`

- [ ] **Step 1: Create `.npmrc`**

```
save-exact=true
```

- [ ] **Step 2: Write a clean `package.json`**

```json
{
  "name": "threesam",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "test": "playwright test",
    "test:visual": "playwright test tests/visual.spec.ts",
    "test:smoke": "playwright test tests/routes.spec.ts",
    "lint": "eslint .",
    "wasm:build": "cargo build --manifest-path rust/garden_math/Cargo.toml --target wasm32-unknown-unknown --release && cp rust/garden_math/target/wasm32-unknown-unknown/release/garden_math.wasm static/wasm/garden_math.wasm"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 3: Install SvelteKit + adapter + deps**

```bash
pnpm add -D --save-exact \
  @sveltejs/kit \
  @sveltejs/adapter-vercel \
  @sveltejs/vite-plugin-svelte \
  svelte \
  vite \
  typescript \
  svelte-check \
  @types/node \
  @playwright/test \
  tailwindcss \
  @tailwindcss/postcss \
  @tailwindcss/vite \
  eslint
```

- [ ] **Step 4: Install runtime deps that survive the port (exact-pinned, mirroring current versions where possible)**

```bash
pnpm add --save-exact \
  chart.js \
  d3-cloud \
  three \
  marked \
  marked-emoji \
  node-emoji \
  fast-xml-parser \
  sharp
pnpm add -D --save-exact \
  @types/d3-cloud \
  @types/three
```

- [ ] **Step 5: Write `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
    alias: {
      $components: 'src/lib/components',
      $lib: 'src/lib',
    },
  },
};
```

- [ ] **Step 6: Write `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 7: Write `tsconfig.json`**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 8: Write `src/app.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 9: Write `src/app.d.ts`**

```ts
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
}
export {};
```

- [ ] **Step 10: Move `app/globals.css` → `src/app.css` (file-level move, content unchanged)**

```bash
mkdir -p src
mv -n app/globals.css src/app.css 2>/dev/null || true
# If app/ was already deleted in Task 2.1, copy the contents from main:
git show main:app/globals.css > src/app.css
```

- [ ] **Step 11: Write a placeholder `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 12: Write a placeholder `src/routes/+page.svelte`**

```svelte
<main class="p-9 font-mono text-sm">scaffold ok</main>
```

- [ ] **Step 13: Move public assets**

```bash
mkdir -p static
# Bring back public/ from main; we deleted node_modules + Next config but public/ should still exist if not, restore it:
if [ ! -d public ]; then
  git checkout main -- public
fi
mv public/* static/
rmdir public 2>/dev/null || true
# WASM specifically
mkdir -p static/wasm
if [ ! -f static/wasm/garden_math.wasm ] && [ -f rust/garden_math/target/wasm32-unknown-unknown/release/garden_math.wasm ]; then
  cp rust/garden_math/target/wasm32-unknown-unknown/release/garden_math.wasm static/wasm/garden_math.wasm
fi
```

- [ ] **Step 14: Restore `lib/`, `content/`, `data/`, `components/`, `types/`, `rust/` from main if missing**

These weren't deleted in Task 2.1 but confirm they exist; if a previous step accidentally removed them:

```bash
for d in lib content data components types rust; do
  if [ ! -d "$d" ]; then git checkout main -- "$d"; fi
done
```

- [ ] **Step 15: Boot dev server, confirm "scaffold ok" renders**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sf http://localhost:3000/ | grep -q "scaffold ok"
kill $DEV_PID
```

Expected: grep matches.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "scaffold: SvelteKit + adapter-vercel + Tailwind v4"
```

---

# Phase 3 — Shell

### Task 3.1: Port SEO helpers and constants

**Files:**
- Create: `src/lib/seo.ts`

- [ ] **Step 1: Write `src/lib/seo.ts`**

```ts
export const SITE_URL = "https://threesam.com";

export const SITE_DESCRIPTION =
  "Artist-engineer creating at the intersection of sound, code, and human performance.";

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}

export function resolveTitle(title: string | undefined): string {
  if (!title) return 'threesam';
  return `${title} — threesam`;
}

export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: "Sam D'Angelo",
  alternateName: 'threesam',
  url: SITE_URL,
  jobTitle: 'Artist-Engineer',
  sameAs: [
    'https://github.com/threesam',
    'https://soundcloud.com/threesam',
  ],
};

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'threesam',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: { '@type': 'Person', name: "Sam D'Angelo", url: SITE_URL },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/seo.ts
git commit -m "shell: port SEO helpers + JSON-LD constants"
```

### Task 3.2: Write the layout with Nav, fonts, JSON-LD, analytics

**Files:**
- Create: `src/lib/components/Nav.svelte`
- Replace: `src/routes/+layout.svelte`
- Modify: `src/app.html` (preconnect for Google Fonts)

- [ ] **Step 1: Write `src/lib/components/Nav.svelte`**

```svelte
<script lang="ts">
  // The brand-framework hubs (signal/source/resonance) are removed.
  // Nav reduces to home + studio.
</script>

<nav class="fixed top-0 right-0 z-50 flex items-center gap-1.5 p-3 md:gap-3 md:p-6">
  <a
    href="/"
    class="mr-1.5 font-mono text-xs tracking-[0.16em] text-zinc-300 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:mr-3 md:text-sm"
  >
    threesam
  </a>
  <a
    href="https://sixtom.com"
    target="_blank"
    rel="noopener noreferrer"
    class="rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:text-xs"
  >
    studio ↗
  </a>
</nav>
```

- [ ] **Step 2: Replace `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import { PERSON_JSON_LD, WEBSITE_JSON_LD } from '$lib/seo';
  import { page } from '$app/state';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Epilogue:wght@400;500;700&display=swap"
  />
  <script
    src="https://analytics.sixtom.com/script.js"
    data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
    async
  ></script>
  {@html `<script type="application/ld+json">${JSON.stringify(PERSON_JSON_LD)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(WEBSITE_JSON_LD)}</script>`}
</svelte:head>

<Nav />
<div style="background: var(--white)">
  {@render children()}
</div>
```

> **Note on fonts**: Next was using `next/font/google` to self-host. We switch to the CDN stylesheet via `<link>` — simpler, and Lighthouse gets near-identical scores with `display=swap` and `preconnect`. If Lighthouse Phase 10 shows a regression, switch to `@fontsource-variable/recursive` and `@fontsource/epilogue` (self-hosted).

- [ ] **Step 3: Update `src/app.css` — remove the references to `--font-recursive` / `--font-epilogue` next/font CSS variables; replace with the CDN-loaded family names directly**

In `src/app.css`, replace the `@theme inline` block's font lines:

```css
/* before */
--font-sans: var(--font-recursive);
--font-mono: var(--font-recursive);
--font-essay: var(--font-epilogue);

/* after */
--font-sans: "Recursive", Arial, Helvetica, sans-serif;
--font-mono: "Recursive", monospace;
--font-essay: "Epilogue", Georgia, serif;
```

And replace the `body` font-family line:

```css
font-family: "Recursive", Arial, Helvetica, sans-serif;
```

And replace the `.tier-essay` font-family line:

```css
font-family: "Epilogue", Georgia, serif;
```

- [ ] **Step 4: Boot dev server, hit `/`, check nav + font render**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sf http://localhost:3000/ | grep -q 'threesam' && echo "OK"
kill $DEV_PID
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "shell: layout, Nav (pruned to threesam + studio), fonts via CDN"
```

### Task 3.3: Port `not-found` and error pages

**Files:**
- Create: `src/routes/+error.svelte`

- [ ] **Step 1: Inspect the current Next `not-found.tsx`**

```bash
git show main:app/not-found.tsx
```

- [ ] **Step 2: Write `src/routes/+error.svelte` matching the visual style**

Use the existing 404 copy/layout from `app/not-found.tsx`. SvelteKit's `+error.svelte` covers all error statuses; check `page.status` for 404 vs other errors.

```svelte
<script lang="ts">
  import { page } from '$app/state';
</script>

<main class="copy-lower mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
  <h1 class="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
    {page.status === 404 ? '404' : page.status}
  </h1>
  <p class="mt-3 text-sm leading-7 text-zinc-400">
    {page.status === 404 ? "lost the thread. let's start over." : page.error?.message ?? 'something broke.'}
  </p>
  <a href="/" class="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-zinc-300 hover:text-zinc-100">
    home →
  </a>
</main>
```

(If the live Next `not-found.tsx` has different copy/markup, mirror that instead.)

- [ ] **Step 3: Commit**

```bash
git add src/routes/+error.svelte
git commit -m "shell: error page (404 + generic)"
```

### Task 3.4: Port sitemap and robots as endpoints

**Files:**
- Create: `src/routes/sitemap.xml/+server.ts`
- Create: `src/routes/robots.txt/+server.ts`
- Move: `lib/art/registry.ts` → `src/lib/art/registry.ts` (and dependent files)

- [ ] **Step 1: Move `lib/art/` to `src/lib/art/`**

```bash
mkdir -p src/lib
mv lib/art src/lib/art
```

- [ ] **Step 2: Update any imports inside `src/lib/art/` that use `@/` aliases**

```bash
grep -rln "@/" src/lib/art/ 2>/dev/null
```

Replace any `@/lib/...` with `$lib/...` and `@/...` with the appropriate relative or `$lib/` alias.

- [ ] **Step 3: Move `lib/seo.ts` (delete the old one — Task 3.1 wrote the new one in src/lib)**

```bash
rm -f lib/seo.ts
```

- [ ] **Step 4: Write `src/routes/sitemap.xml/+server.ts`**

```ts
import { visibleSketches } from '$lib/art/registry';
import { SITE_URL } from '$lib/seo';

const STATIC_ROUTES = [
  '/',
  '/canvas/self',
  '/shelf',
  '/sounds',
  '/thoughts',
  '/dad',
  '/deana',
  '/benny',
  '/anything-but-analog',
];

export const prerender = true;

export async function GET() {
  const now = new Date().toISOString();
  const entries: Array<{ url: string; lastmod: string }> = [
    ...STATIC_ROUTES.map((p) => ({ url: `${SITE_URL}${p}`, lastmod: now })),
    ...visibleSketches.map((s) => ({
      url: `${SITE_URL}/anything-but-analog/${s.slug}`,
      lastmod: s.date ? new Date(s.date).toISOString() : now,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.url}</loc><lastmod>${e.lastmod}</lastmod></url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

- [ ] **Step 5: Inspect current robots, port to endpoint**

```bash
git show main:app/robots.ts
```

- [ ] **Step 6: Write `src/routes/robots.txt/+server.ts` mirroring the output**

```ts
import { SITE_URL } from '$lib/seo';

export const prerender = true;

export async function GET() {
  const body = `User-Agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
```

(If the current `app/robots.ts` has different rules — disallows, user-agent specifics — mirror exactly.)

- [ ] **Step 7: Boot dev server, verify both endpoints**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sf http://localhost:3000/sitemap.xml | head -5
curl -sf http://localhost:3000/robots.txt
kill $DEV_PID
```

Expected: sitemap shows XML with `<urlset>`; robots shows `User-Agent: *`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "shell: sitemap.xml + robots.txt endpoints"
```

### Task 3.5: Port OutboundTracker (analytics for outbound clicks)

**Files:**
- Create: `src/lib/components/OutboundTracker.svelte`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Inspect the current React tracker**

```bash
git show main:components/analytics/outbound-tracker.tsx
git show main:lib/track.ts 2>/dev/null
```

- [ ] **Step 2: Port to Svelte**

```svelte
<!-- src/lib/components/OutboundTracker.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      const isExternal = /^https?:\/\//i.test(href) && !href.startsWith(location.origin);
      if (!isExternal) return;
      // Match the original tracker's umami event call.
      const umami = (window as any).umami;
      if (umami?.track) umami.track('outbound', { url: href });
    };
    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  });
</script>
```

(If the original used a different event name, payload, or analytics library, mirror exactly.)

- [ ] **Step 3: Mount in `src/routes/+layout.svelte`**

Add the import and component just inside the `<svelte:head>`-following body:

```svelte
<script lang="ts">
  // ... existing imports ...
  import OutboundTracker from '$lib/components/OutboundTracker.svelte';
</script>

<!-- ... existing svelte:head ... -->

<OutboundTracker />
<Nav />
<!-- ... rest unchanged ... -->
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "analytics: port OutboundTracker for umami outbound clicks"
```

### Task 3.6: Per-page metadata helper

**Files:**
- Create: `src/lib/components/SeoHead.svelte`

- [ ] **Step 1: Write `src/lib/components/SeoHead.svelte`**

```svelte
<script lang="ts">
  import { SITE_URL, SITE_DESCRIPTION, resolveTitle } from '$lib/seo';

  interface Props {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  }
  let { title, description, ogImage, canonical }: Props = $props();

  const resolvedTitle = $derived(resolveTitle(title));
  const resolvedDescription = $derived(description ?? SITE_DESCRIPTION);
  const resolvedOg = $derived(ogImage ?? '/og/default.png');
  const resolvedCanonical = $derived(canonical ?? '/');
</script>

<svelte:head>
  <title>{resolvedTitle}</title>
  <meta name="description" content={resolvedDescription} />
  <link rel="canonical" href={`${SITE_URL}${resolvedCanonical}`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="threesam" />
  <meta property="og:title" content={resolvedTitle} />
  <meta property="og:description" content={resolvedDescription} />
  <meta property="og:image" content={resolvedOg} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={resolvedTitle} />
  <meta name="twitter:description" content={resolvedDescription} />
  <meta name="twitter:image" content={resolvedOg} />
</svelte:head>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/SeoHead.svelte
git commit -m "shell: SeoHead component for per-page metadata"
```

---

# Phase 4 — Text/markdown routes

Each route below ports one-for-one. The pattern is:

1. Read the Next page source: `git show main:app/<route>/page.tsx`
2. Move/copy any non-React lib code under `src/lib/`
3. Create `src/routes/<route>/+page.svelte` with the same DOM markup and Tailwind classes (translate JSX → Svelte 5 syntax)
4. If the page needs server-side data (markdown, files), create `src/routes/<route>/+page.server.ts` with a `load` function
5. Drop `<SeoHead title="...">` at the top of `+page.svelte`
6. Boot dev, hit the route, eyeball it
7. Commit

JSX → Svelte 5 translation cheat sheet:
- `className=` → `class=`
- `{children}` (component prop) → `{@render children()}`
- `useState` → `let x = $state(0)`
- `useEffect(fn, [])` → `$effect(() => { fn() })` (component-only) or `onMount` from `svelte`
- `useMemo` → `$derived(...)`
- `<Link href="/x">` → `<a href="/x">` (SvelteKit will SPA-navigate)
- `<Image src=.../>` → `<img src=... alt="..." width="..." height="..." loading="lazy" />`
- `<Script src=...>` → `<svelte:head><script src=... async></script></svelte:head>`
- `// "use client";` → delete; in SvelteKit, by default routes render SSR + hydrate
- For client-only logic (canvas, WASM, browser APIs), guard with `if (browser)` from `$app/environment` or use Svelte actions which only run client-side

### Task 4.1: Port `/shelf`

**Files:**
- Move: `lib/goodreads.ts` → `src/lib/goodreads.ts`
- Move: `lib/dominant-color.ts` → `src/lib/dominant-color.ts` (if used by shelf)
- Create: `src/routes/shelf/+page.server.ts`
- Create: `src/routes/shelf/+page.svelte`

- [ ] **Step 1: Inspect current source**

```bash
git show main:app/shelf/page.tsx
```

- [ ] **Step 2: Move lib files**

```bash
mv lib/goodreads.ts src/lib/goodreads.ts
mv lib/dominant-color.ts src/lib/dominant-color.ts 2>/dev/null || true
```

Fix any `@/` imports inside these files.

- [ ] **Step 3: Identify what shelf renders**

If shelf fetches Goodreads at request time, the fetch goes in `+page.server.ts`. If it reads a JSON file, same.

- [ ] **Step 4: Write `src/routes/shelf/+page.server.ts` (only if data load needed)**

```ts
import { fetchGoodreadsBooks } from '$lib/goodreads';

export const prerender = true; // shelf data is fetched at build time

export async function load() {
  const books = await fetchGoodreadsBooks();
  return { books };
}
```

(Adjust to the actual function name/signature in `goodreads.ts`.)

- [ ] **Step 5: Write `src/routes/shelf/+page.svelte`**

Mirror the original markup. Example structure (adjust to actual):

```svelte
<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  let { data } = $props();
</script>

<SeoHead title="shelf" description="books I'm reading." canonical="/shelf" />

<main class="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-18 pt-18 md:px-9">
  <h1 class="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">shelf</h1>
  <!-- Mirror the rest of app/shelf/page.tsx markup, replacing
       <Image>/<Link> and React idioms per the cheat sheet. -->
</main>
```

- [ ] **Step 6: Hit the route**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sI http://localhost:3000/shelf | head -1   # expect 200
kill $DEV_PID
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "port: /shelf"
```

### Task 4.2 – 4.6: Port `/sounds`, `/thoughts`, `/dad`, `/deana`, `/benny`

For each route, follow the same six steps as Task 4.1. Per-route notes:

| Route | Notes |
|---|---|
| `/sounds` | Currently 30 lines. Mostly static; check for any embedded SoundCloud iframe. |
| `/thoughts` | Likely a markdown-driven list. If it reads from `content/`, port the reader in `+page.server.ts`. |
| `/dad` | 47-line tribute page; check for `<Video>` or `<LazyMount>` usage. |
| `/deana` | 86 lines but most of the heft is in `components/messages/*` — those come in Phase 5. For this task, port the route shell with placeholders where message components go. Wire up real components in Phase 5. |
| `/benny` | 149 lines with playlists slider + 41-min `<video>` + WebVTT subtitles + `app/benny/playlists.ts` data file. Move `app/benny/playlists.ts` to `src/lib/benny/playlists.ts` and import from `+page.svelte`. The `<video>` tag with `<track kind="subtitles" src="/assets/benny/the_podcast.vtt" srclang="en" default>` ports directly. |

Each task:

- [ ] **Steps (one task per route, 4.2 → 4.6):**

```
1. git show main:app/<route>/page.tsx (and any sibling files like playlists.ts)
2. Move any sibling data files (e.g. app/benny/playlists.ts) under src/lib/<route>/
3. Write src/routes/<route>/+page.svelte mirroring markup, with <SeoHead> at top
4. If data fetching is needed: src/routes/<route>/+page.server.ts with load()
5. curl -sI http://localhost:3000/<route> | head -1  → expect 200
6. git add -A && git commit -m "port: /<route>"
```

For `/deana`, leave `<!-- TODO Phase 5: <MessageTimeline data={...}> -->` style HTML comments at the message-component insertion points. Phase 5 fills them in.

---

# Phase 5 — Canvas / three / ascii / messages components

The pattern: every React component that wraps imperative DOM/canvas logic becomes either (a) a Svelte component that uses an action, or (b) just an action if there's no surrounding markup.

### Task 5.1: Common pattern — write a Svelte action wrapper

**Files:**
- Create: `src/lib/components/canvas/actions/_template.ts` (delete after — this is a reference)

- [ ] **Step 1: Document the canonical action shape** (write to `src/lib/components/canvas/actions/_README.md`)

```md
# Canvas action pattern

Every canvas component becomes an `Action<HTMLCanvasElement, Params>` that
owns the requestAnimationFrame loop, resize observer, and any other
imperative setup. Pure draw logic stays in plain TS modules under
`src/lib/art/` — the action wires them to the DOM.

```ts
// src/lib/components/canvas/actions/example.ts
import type { Action } from 'svelte/action';

interface Params { /* ... */ }

export const exampleCanvas: Action<HTMLCanvasElement, Params> = (node, params) => {
  const ctx = node.getContext('2d')!;
  let raf = 0;
  let current = params;
  const ro = new ResizeObserver(() => {
    const dpr = window.devicePixelRatio;
    node.width = node.clientWidth * dpr;
    node.height = node.clientHeight * dpr;
  });
  ro.observe(node);

  const loop = (t: number) => {
    // draw with `current` (which `update` keeps fresh)
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    update(next: Params) { current = next; },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
};
```

Usage:

```svelte
<script lang="ts">
  import { exampleCanvas } from '$lib/components/canvas/actions/example';
  let { foo } = $props();
</script>

<canvas use:exampleCanvas={{ foo }} class="..."></canvas>
```
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/canvas/actions/_README.md
git commit -m "canvas: document action wrapper pattern"
```

### Task 5.2: Port `components/canvas/cloud-canvas.tsx` (prod baked + dev shader)

**Files:**
- Move: `lib/perf-flags.ts` → `src/lib/perf-flags.ts` (used by cloud-canvas to gate dev vs prod)
- Create: `src/lib/components/canvas/CloudCanvas.svelte`
- Create: `src/lib/components/canvas/actions/cloud-shader.ts`

- [ ] **Step 1: Read current source**

```bash
git show main:components/canvas/cloud-canvas.tsx
git show main:components/canvas/cloud-canvas-dev.tsx
git show main:components/canvas/cloud-canvas-live.tsx
git show main:components/canvas/cloud-sprite.tsx
git show main:lib/perf-flags.ts
```

- [ ] **Step 2: Move `lib/perf-flags.ts`**

```bash
mv lib/perf-flags.ts src/lib/perf-flags.ts
```

- [ ] **Step 3: Write `src/lib/components/canvas/CloudCanvas.svelte`**

```svelte
<script lang="ts">
  import { dev } from '$app/environment';
  import { cloudShader } from './actions/cloud-shader';

  interface Props { mirror?: boolean }
  let { mirror = false }: Props = $props();
</script>

{#if dev}
  <canvas
    use:cloudShader={{ mirror }}
    class={mirror ? 'h-full w-full scale-y-[-1]' : 'h-full w-full'}
  ></canvas>
{:else}
  <img
    src="/assets/clouds-baked.webp"
    alt=""
    class={mirror ? 'h-full w-full object-cover scale-y-[-1]' : 'h-full w-full object-cover'}
    aria-hidden="true"
  />
{/if}
```

(If the original used different baked asset paths or scaled differently for mirror, mirror that.)

- [ ] **Step 4: Port the WebGL shader logic into `src/lib/components/canvas/actions/cloud-shader.ts`**

Lift the shader setup from the original `cloud-canvas-live.tsx` (uniforms, vertex/fragment GLSL, draw loop). Keep the shader strings verbatim. The action owns `gl.createProgram` etc. and cleans up on `destroy`.

- [ ] **Step 5: Hit `/` (still placeholder home) — should show the baked WebP in prod build, shader in dev**

For now visually verify in dev:

```bash
pnpm dev &
DEV_PID=$!
sleep 4
kill $DEV_PID
```

(Manual eyeball; full home wiring is Phase 6.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "canvas: CloudCanvas (baked WebP prod, shader dev)"
```

### Task 5.3: Port the rest of `components/canvas/*`

**Files to port** (one task per component, 5.3.1 → 5.3.N):

| Original | New |
|---|---|
| `components/canvas/canvas.tsx` | `src/lib/components/canvas/Canvas.svelte` |
| `components/canvas/voronoi-canvas.tsx` | `src/lib/components/canvas/VoronoiCanvas.svelte` + action |
| `components/canvas/voronoi-image.tsx` | `src/lib/components/canvas/VoronoiImage.svelte` + action |
| `components/canvas/metaball-canvas.tsx` | `src/lib/components/canvas/MetaballCanvas.svelte` + action |
| `components/canvas/particle-text-canvas.tsx` | `src/lib/components/canvas/ParticleTextCanvas.svelte` + action |
| `components/canvas/breakout.tsx` | `src/lib/components/canvas/Breakout.svelte` + action |
| `components/canvas/vision.tsx` | `src/lib/components/canvas/Vision.svelte` |
| `components/canvas/mood.tsx` | `src/lib/components/canvas/Mood.svelte` |
| `components/canvas/thoughts.tsx` | `src/lib/components/canvas/Thoughts.svelte` |
| `components/canvas/index.ts` | `src/lib/components/canvas/index.ts` (re-exports) |

Each:

- [ ] **Steps:**

```
1. git show main:components/canvas/<file>.tsx
2. Extract the draw logic into the action; mount/cleanup into the action's
   destroy.
3. Write the Svelte component with the same props as the original. Convert
   useEffect cleanup → action destroy; useRef<HTMLCanvasElement> → use:action.
4. If the component had any non-canvas JSX wrapping the canvas (e.g. caption,
   container div), port that wrapper too.
5. Re-export from src/lib/components/canvas/index.ts
6. Commit per component or in batches of related ones:
   git commit -m "canvas: port <ComponentName>"
```

### Task 5.4: Port `components/ascii/*`

| Original | New |
|---|---|
| `components/ascii/ascii-canvas.tsx` | `src/lib/components/ascii/AsciiCanvas.svelte` + action |
| `components/ascii/ascii-gallery.tsx` | `src/lib/components/ascii/AsciiGallery.svelte` |
| `components/ascii/ascii-hero.tsx` | `src/lib/components/ascii/AsciiHero.svelte` |

Same pattern as Task 5.3.

- [ ] **Steps:** see Task 5.3 step template. Commit per component.

### Task 5.5: Port `components/messages/*` (used on `/deana`)

There are ~20 files. Many are pure visualization components using `chart.js`, custom canvas, or just JSX layout.

| Category | Files | Strategy |
|---|---|---|
| chart.js wrappers | `clock-heatmap.tsx`, `word-stats.tsx`, `message-lengths.tsx`, `emoji-meter.tsx`, etc. | Svelte action that calls `new Chart(node, config)` on mount, `chart.destroy()` on destroy. |
| Custom canvas | `word-cloud.tsx`, `emoji-card-bg.tsx`, `ascii-image.tsx`, `clock-heatmap.tsx` (if not chart) | Standard canvas action pattern. |
| Pure JSX layout | `daily-firsts.tsx`, `compliments.tsx`, `pet-names.tsx`, `milestones.tsx`, `love-timeline.tsx`, `message-timeline.tsx`, `dana-label.tsx`, `emoji-hero.tsx`, `ascii-image-section.tsx`, `first-night.tsx` | Straight JSX → Svelte translation. |
| Data | `deana-images.ts` | Move to `src/lib/deana/images.ts` |
| Lazy | `lazy-word-cloud.tsx` | Wraps WordCloud with React.lazy; replace with `{#await import(...)} ... {:then Mod} <Mod.default ... /> {/await}` |

- [ ] **Steps for each file:**

```
1. git show main:components/messages/<file>.tsx
2. Create src/lib/components/messages/<ComponentName>.svelte (PascalCase)
3. Port the markup and behavior. For chart.js components, use the action pattern.
4. If the original needs JSON data (e.g. deana-images.ts), move that under src/lib/deana/
5. Commit per component or in logical batches:
   git commit -m "messages: port <ComponentName>"
```

- [ ] **Step at the end of 5.5:** Wire all message components into `src/routes/deana/+page.svelte`, replacing the `<!-- TODO Phase 5: ... -->` placeholders left in Phase 4. Boot dev, hit `/deana`, eyeball each section.

```bash
pnpm dev &
DEV_PID=$!
sleep 4
kill $DEV_PID
git add src/routes/deana/+page.svelte
git commit -m "deana: wire ported message components"
```

### Task 5.6: Port `components/art/*`, `components/frame/*`, `components/gallery/*`, `components/banners/*`, `components/portfolio/*` (skip — being deleted), `components/sections/*` (skip — being deleted)

**Port:**

| Original | New |
|---|---|
| `components/art/sketch-host.tsx` | `src/lib/components/art/SketchHost.svelte` + action |
| `components/art/art-gallery.tsx` | `src/lib/components/art/ArtGallery.svelte` |
| `components/art/art-scroll-sync.tsx` | `src/lib/components/art/ArtScrollSync.svelte` |
| `components/frame/guide.tsx` | `src/lib/components/frame/Guide.svelte` |
| `components/frame/anchor.tsx` | `src/lib/components/frame/Anchor.svelte` |
| `components/frame/index.ts` | `src/lib/components/frame/index.ts` |
| `components/gallery/gallery.tsx` | `src/lib/components/gallery/Gallery.svelte` |
| `components/banners/anything-but-analog-banner.tsx` | `src/lib/components/banners/AnythingButAnalogBanner.svelte` |
| `components/nav.tsx` | already ported in Task 3.2 |
| `components/link.tsx` | inline `<a>` everywhere; if it had custom hover behavior, port as `Link.svelte` |
| `components/prose.tsx` | `src/lib/components/Prose.svelte` |
| `components/video.tsx` | `src/lib/components/Video.svelte` (uses `lib/use-video-visibility.ts` — port that as an action `src/lib/components/actions/video-visibility.ts`) |
| `components/lazy-mount.tsx` | `src/lib/components/LazyMount.svelte` (IntersectionObserver-based mount delay) |

**Do not port:**
- `components/audio/*` — deleted in Phase 8
- `components/hero/*` — deleted in Phase 8
- `components/sections/*` — deleted in Phase 8
- `components/portfolio/work-card.tsx` — deleted in Phase 8
- `components/fitness/step-dashboard.tsx` — deleted in Phase 8

- [ ] **Steps:** apply the same per-file pattern. Commit per logical batch.

---

# Phase 6 — Home + anything-but-analog (the bulk of the dynamic content)

### Task 6.1: Home page

**Files:**
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Inspect current**

```bash
git show main:app/page.tsx
```

- [ ] **Step 2: Write `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import CloudCanvas from '$lib/components/canvas/CloudCanvas.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead canonical="/" />

<main class="flex h-dvh w-full flex-col overflow-hidden">
  <section class="relative h-[25dvh] w-full overflow-hidden">
    <CloudCanvas mirror />
  </section>
  <div class="relative h-[50dvh] w-full">
    <Gallery />
  </div>
  <section class="relative h-[25dvh] w-full overflow-hidden">
    <CloudCanvas />
  </section>
</main>
```

> **Note**: the original layout comment about suppressing the bottom `Anchor` on `/` — handle by checking `page.url.pathname` inside `+layout.svelte`'s Anchor render condition.

- [ ] **Step 3: Update `+layout.svelte` to conditionally suppress Anchor on `/`**

In `src/routes/+layout.svelte`, after the `{@render children()}` line:

```svelte
<script lang="ts">
  // ... existing imports ...
  import Anchor from '$lib/components/frame/Anchor.svelte';
  import { page } from '$app/state';
  // ... existing `let { children } = $props();` ...
</script>
```

And in markup:

```svelte
<Nav />
<div style="background: var(--white)">
  {@render children()}
  {#if page.url.pathname !== '/'}
    <Anchor />
  {/if}
</div>
```

- [ ] **Step 4: Boot and check**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sI http://localhost:3000/ | head -1   # 200
kill $DEV_PID
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "port: home (Gallery + CloudCanvas top/bottom)"
```

### Task 6.2: `/anything-but-analog` index

**Files:**
- Create: `src/routes/anything-but-analog/+page.server.ts` (if data needed)
- Create: `src/routes/anything-but-analog/+page.svelte`

- [ ] **Step 1: Inspect**

```bash
git show main:app/anything-but-analog/page.tsx
```

- [ ] **Step 2: Write `+page.server.ts`**

```ts
import { visibleSketches } from '$lib/art/registry';

export const prerender = true;

export async function load() {
  return { sketches: visibleSketches };
}
```

- [ ] **Step 3: Write `+page.svelte` mirroring original markup**

Use the same grid/list layout the original had. Each tile is an `<a href="/anything-but-analog/{slug}">`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "port: /anything-but-analog index"
```

### Task 6.3: `/anything-but-analog/[slug]`

**Files:**
- Create: `src/routes/anything-but-analog/[slug]/+page.server.ts`
- Create: `src/routes/anything-but-analog/[slug]/+page.svelte`

- [ ] **Step 1: Inspect**

```bash
git show main:app/anything-but-analog/[slug]/page.tsx
git show main:app/anything-but-analog/[slug]/redirect.tsx
```

- [ ] **Step 2: Decide on the redirect logic** — if the original `redirect.tsx` redirects old slugs to canonical, port the same map. Implement in `+page.server.ts`:

```ts
import { error, redirect } from '@sveltejs/kit';
import { getSketch, visibleSketches } from '$lib/art/registry';

export const prerender = () => visibleSketches.map((s) => ({ slug: s.slug }));

export function load({ params }) {
  // If you had a slug-redirect map in redirect.tsx, port it here:
  // const REDIRECTS: Record<string, string> = { 'old-slug': 'new-slug' };
  // if (REDIRECTS[params.slug]) throw redirect(308, `/anything-but-analog/${REDIRECTS[params.slug]}`);

  const sketch = getSketch(params.slug);
  if (!sketch) throw error(404, 'sketch not found');
  return { sketch };
}
```

- [ ] **Step 3: Write `+page.svelte`**

```svelte
<script lang="ts">
  import SketchHost from '$lib/components/art/SketchHost.svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  let { data } = $props();
  const { sketch } = $derived(data);
</script>

<SeoHead title={sketch.title} description={sketch.description} canonical={`/anything-but-analog/${sketch.slug}`} />

<main class="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-18 pt-18 md:px-9">
  <h1 class="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">{sketch.title}</h1>
  {#if sketch.description}
    <p class="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{sketch.description}</p>
  {/if}
  <div class="mt-9">
    <SketchHost {sketch} />
  </div>
</main>
```

(Adjust markup to match the original layout exactly.)

- [ ] **Step 4: Visit one sketch in dev**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
FIRST=$(curl -sf http://localhost:3000/anything-but-analog | grep -oE 'href="/anything-but-analog/[a-z0-9-]+"' | head -1 | sed 's|href="||;s|"||')
curl -sI "http://localhost:3000${FIRST}" | head -1
kill $DEV_PID
```

Expected: 200.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "port: /anything-but-analog/[slug] (dynamic + redirects)"
```

### Task 6.4: Verify all 31 sketches render

- [ ] **Step 1: Visit every sketch URL in dev**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
SLUGS=$(curl -sf http://localhost:3000/anything-but-analog | grep -oE 'href="/anything-but-analog/[a-z0-9-]+"' | sed 's|href="||;s|"||' | sort -u)
for s in $SLUGS; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$s")
  echo "$code $s"
done | tee /tmp/sketch-status.log
kill $DEV_PID
grep -v '^200 ' /tmp/sketch-status.log && echo "FAIL — non-200 sketches above" || echo "all 200"
```

Expected: all 200. If any non-200, fix that sketch's port (likely an import path or registry entry) before continuing.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git diff --cached --stat
git commit -m "fix: sketch route 404s from port" || true
```

---

# Phase 7 — `/canvas/self` + `/api/counters`

### Task 7.1: `/canvas/self`

**Files:**
- Create: `src/routes/canvas/self/+page.svelte`

- [ ] **Step 1: Inspect original**

```bash
git show main:app/canvas/[handle]/page.tsx
```

- [ ] **Step 2: Write the page**

Only the `handle === "self"` branch is kept. Inline the resulting markup directly:

```svelte
<script lang="ts">
  import VoronoiImage from '$lib/components/canvas/VoronoiImage.svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead
  title="self"
  description="An evolving voronoi-treated portrait."
  ogImage="/og/self.png"
  canonical="/canvas/self"
/>

<main class="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-18 pt-18 md:px-9">
  <h1 class="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">self</h1>
  <!-- Mirror the body links + voronoi banner from the original; the
       original had `<VoronoiBanner src="/assets/self-hero.webp" />` style
       markup. -->
  <div class="voronoi-banner mt-12">
    <div class="voronoi-banner-inner">
      <VoronoiImage src="/assets/self-hero.webp" />
    </div>
  </div>
  <!-- Body links to /benny and /dad — port those from the original. -->
</main>
```

- [ ] **Step 3: Hit `/canvas/self`**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sI http://localhost:3000/canvas/self | head -1
kill $DEV_PID
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "port: /canvas/self (flattened from [handle])"
```

### Task 7.2: `/api/counters`

**Files:**
- Move: `lib/server/counter-store.ts` → `src/lib/server/counter-store.ts`
- Move: `types/counters.ts` → `src/lib/types/counters.ts` (or wherever the type lived)
- Create: `src/routes/api/counters/+server.ts`

- [ ] **Step 1: Move server counter store**

```bash
mkdir -p src/lib/server
mv lib/server/counter-store.ts src/lib/server/counter-store.ts
mkdir -p src/lib/types
mv types/counters.ts src/lib/types/counters.ts
```

Update the imports inside `counter-store.ts`:

```ts
import type { CounterType, CountersState } from '$lib/types/counters';
import { EMPTY_COUNTERS } from '$lib/types/counters';
```

- [ ] **Step 2: Read the existing Next route to see its GET/POST shape**

```bash
git show main:app/api/counters/route.ts
```

- [ ] **Step 3: Write `src/routes/api/counters/+server.ts`**

```ts
import { json, error } from '@sveltejs/kit';
import { readCounters, incrementCounter } from '$lib/server/counter-store';
import type { CounterType } from '$lib/types/counters';

const VALID_TYPES: CounterType[] = ['visitor', 'artView', 'musicPlay'];

export async function GET() {
  const counters = await readCounters();
  return json(counters);
}

export async function POST({ request }) {
  const body = (await request.json().catch(() => null)) as { type?: string } | null;
  const type = body?.type;
  if (!type || !VALID_TYPES.includes(type as CounterType)) {
    throw error(400, 'invalid counter type');
  }
  const counters = await incrementCounter(type as CounterType);
  return json(counters);
}
```

(If the original route had different validation or response shape, mirror exactly.)

- [ ] **Step 4: Verify**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
curl -sf http://localhost:3000/api/counters | head -1
curl -sf -X POST -H 'content-type: application/json' -d '{"type":"visitor"}' http://localhost:3000/api/counters
kill $DEV_PID
```

Expected: GET returns JSON with `totalVisitors`, `generativeArtViews`, `musicPlays`, `updatedAt`. POST returns the incremented JSON.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "port: /api/counters (+server.ts, same shape, ephemeral fs)"
```

---

# Phase 8 — Delete dropped surface

### Task 8.1: Remove orphan directories and files

**Files:** delete only.

- [ ] **Step 1: Delete dead components and lib pieces**

```bash
rm -rf components/audio
rm -rf components/hero
rm -rf components/sections
rm -rf components/portfolio
rm -rf components/fitness
rm -f lib/steps.ts
rm -f data/steps.mock.json
rm -f types/fitness.ts
```

- [ ] **Step 2: Delete anything else that's now under root `lib/`, `components/`, `types/`, `data/` once corresponding moves happened**

After all phases above, the *old* tree should be empty. Verify:

```bash
ls -la lib/ components/ types/ data/ 2>/dev/null
```

If files remain that were never moved or deleted, decide per-file whether they're (a) still needed and need to move to `src/lib/`, or (b) orphan and should be deleted. Common stragglers:

- `lib/track.ts` (analytics tracking) — move to `src/lib/track.ts`
- `lib/use-video-visibility.ts` — moved in Task 5.6
- `lib/content.ts` (markdown) — move to `src/lib/content.ts`
- `lib/wasm/garden-math.ts` — move to `src/lib/wasm/garden-math.ts`
- `types/counters.ts` — moved in Task 7.2
- `data/counters.json` — KEEP at root `data/counters.json` (counter-store reads from `process.cwd()/data/counters.json`; no change needed unless we move the path)
- `content/` — KEEP at repo root; load with `import.meta.glob` or `fs.readFile` from server load functions
- `rust/` — KEEP unchanged

- [ ] **Step 3: Grep for any stale `@/` imports**

```bash
grep -rln "@/" src/ 2>/dev/null
```

Expected: no matches. Fix any that remain (translate to `$lib/...`).

- [ ] **Step 4: Grep for any stale references to dropped subsystems**

```bash
grep -rln "audio-reactive\|AudioReactiveProvider\|use-audio\|hero/generative-hero\|step-dashboard\|StepDashboard\|WorkCard\|MusicSection\|BioSection\|DisciplineSection" src/ 2>/dev/null
```

Expected: no matches.

- [ ] **Step 5: Type check**

```bash
pnpm check
```

Expected: 0 errors. Fix any.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "prune: delete audio/, hero/, sections/, portfolio/, fitness/, steps/"
```

---

# Phase 9 — Tests pass against the SvelteKit build

### Task 9.1: Run smoke against SvelteKit dev

- [ ] **Step 1:**

```bash
pnpm dev &
DEV_PID=$!
sleep 4
pnpm exec playwright test tests/routes.spec.ts
RESULT=$?
kill $DEV_PID
exit $RESULT
```

Expected: all green. Fix any failures (typically: missing marker text, console errors from un-ported imports).

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git diff --cached --stat
git commit -m "fix: smoke test failures from port" || true
```

### Task 9.2: Run visual diff against the baseline

- [ ] **Step 1: Build for production**

```bash
pnpm build
pnpm preview &
PREVIEW_PID=$!
sleep 5
pnpm exec playwright test tests/visual.spec.ts
RESULT=$?
kill $PREVIEW_PID
```

Expected: green or near-green. Differences will exist (canvas + font rendering may shift); use Playwright's HTML report to triage:

```bash
pnpm exec playwright show-report
```

- [ ] **Step 2: For each failing diff, decide:**

| Symptom | Action |
|---|---|
| Font shifted (CDN vs self-hosted) | Switch fonts to `@fontsource-variable/recursive` + `@fontsource/epilogue` (self-host). Rerun. |
| Canvas pixel drift | Acceptable. Add per-test `mask` for the canvas area: `expect(page).toHaveScreenshot({ mask: [page.locator('canvas')] })`. |
| Layout shifted | Real bug — fix the ported component's markup/classes. Rerun. |
| Color shifted slightly | If under `maxDiffPixelRatio: 0.005`, ignore. If above, investigate (likely a missing `@theme` token). |
| Missing element | Real bug — port whatever's missing. |

- [ ] **Step 3: After all diffs pass, commit any test config changes**

```bash
git add -A
git commit -m "test: stabilize visual diffs vs Next baseline" || true
```

---

# Phase 10 — Lighthouse parity

### Task 10.1: Install Lighthouse CLI and a runner script

**Files:**
- Modify: `package.json` (add a `lh` script)
- Create: `scripts/lighthouse.mjs`

- [ ] **Step 1: Install**

```bash
pnpm add -D --save-exact lighthouse chrome-launcher
```

- [ ] **Step 2: Write `scripts/lighthouse.mjs`**

```js
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'node:fs';

const ROUTES = [
  '/',
  '/shelf',
  '/sounds',
  '/thoughts',
  '/dad',
  '/deana',
  '/benny',
  '/anything-but-analog',
  '/canvas/self',
];

const chrome = await launch({ chromeFlags: ['--headless=new'] });
const opts = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
const results = [];

for (const route of ROUTES) {
  const url = `http://localhost:3000${route}`;
  const runner = await lighthouse(url, opts);
  const cats = runner.lhr.categories;
  results.push({
    route,
    perf: Math.round(cats.performance.score * 100),
    a11y: Math.round(cats.accessibility.score * 100),
    bp:   Math.round(cats['best-practices'].score * 100),
    seo:  Math.round(cats.seo.score * 100),
  });
}

await chrome.kill();
console.table(results);
writeFileSync('lighthouse-results.json', JSON.stringify(results, null, 2));
```

- [ ] **Step 3: Add npm script**

In `package.json`:

```json
"lh": "node scripts/lighthouse.mjs"
```

### Task 10.2: Capture baseline from main + SvelteKit + compare

- [ ] **Step 1: Lighthouse on main (Next) — in a sibling terminal/dir**

```bash
( cd ../.. && pnpm run build && pnpm start ) &
NEXT_PID=$!
sleep 6
pnpm lh > /tmp/lh-next.txt
cp lighthouse-results.json /tmp/lh-next.json
kill $NEXT_PID
```

- [ ] **Step 2: Lighthouse on SvelteKit**

```bash
pnpm build && pnpm preview &
PREVIEW_PID=$!
sleep 5
pnpm lh > /tmp/lh-sveltekit.txt
cp lighthouse-results.json /tmp/lh-sveltekit.json
kill $PREVIEW_PID
```

- [ ] **Step 3: Diff**

```bash
diff -u /tmp/lh-next.json /tmp/lh-sveltekit.json
```

- [ ] **Step 4: For any regression > 2 points, fix**

Common fixes:
- Perf: add `loading="lazy"` to offscreen images, add explicit `width`/`height`, swap CDN fonts for self-hosted, defer the analytics script
- A11y: add missing `alt`, ensure landmarks (`<main>`, `<nav>`), check color contrast
- BP: HTTPS-only assets, no console errors, valid HTML
- SEO: ensure `<title>`, `<meta description>`, valid `<link rel="canonical">`, robots reachable

- [ ] **Step 5: Re-run after fixes, ensure all categories ≥ baseline**

- [ ] **Step 6: Commit results + script**

```bash
git add scripts/lighthouse.mjs package.json /tmp/lh-sveltekit.json
# Actually save results inside the repo, not /tmp:
mkdir -p docs/lighthouse
cp /tmp/lh-next.json docs/lighthouse/baseline-next.json
cp /tmp/lh-sveltekit.json docs/lighthouse/sveltekit.json
git add docs/lighthouse/
git commit -m "lh: capture Lighthouse parity (Next baseline vs SvelteKit)"
```

---

# Phase 11 — Pin exact + CVE audit

### Task 11.1: Verify no carets/tildes anywhere

- [ ] **Step 1: Grep**

```bash
grep -E '"\^|"~' package.json
```

Expected: no output (no carets or tildes in any dep range).

- [ ] **Step 2: Fix any that slipped in**

```bash
# For each offending dep, find the installed version and pin it:
pnpm list <package> --depth 0
# Then edit package.json by hand or:
pnpm add --save-exact <package>@<exact-version>
```

- [ ] **Step 3: Re-verify**

```bash
grep -E '"\^|"~' package.json && echo "STILL HAS CARETS — FIX" || echo "all pinned"
```

### Task 11.2: CVE audit on prod deps

- [ ] **Step 1: Audit prod deps only**

```bash
pnpm audit --prod
```

- [ ] **Step 2: For each high/critical, decide**

| Severity | Action |
|---|---|
| Critical, fix available | Upgrade to the fix (`pnpm update <pkg>@<fixed-version> --save-exact`), re-run tests, commit |
| Critical, no fix | Investigate exploit path; if unreachable in our usage, document in PR description; if reachable, find alternative dep |
| High, fix available | Same as critical |
| High, no fix, dev-only | OK; document |
| Moderate/low | Document; not blocking |

- [ ] **Step 3: Re-run audit, confirm 0 high/critical on prod**

```bash
pnpm audit --prod --audit-level=high
```

Expected: exit 0.

- [ ] **Step 4: Commit any version bumps**

```bash
git add -A
git diff --cached --stat
git commit -m "deps: pin exact + resolve high/critical CVEs on prod" || true
```

---

# Phase 12 — Recursive `/simplify` + `/code-review:code-review`

This is a loop. Run both skills, address all findings, repeat until both pass with no findings.

### Task 12.1: Loop iteration

- [ ] **Step 1: Run `/simplify`**

In the user's session, type `/simplify` (or invoke the `simplify` skill). It reviews changed code for reuse/quality/efficiency and fixes issues found. Apply its fixes.

- [ ] **Step 2: Run `/code-review:code-review`**

Invoke `code-review:code-review`. Apply fixes for any high/medium findings. Low-severity findings can be deferred to a follow-up issue.

- [ ] **Step 3: Run tests + check + lh again**

```bash
pnpm check && pnpm exec playwright test tests/routes.spec.ts
```

If anything regressed because of a simplify/review fix, address before proceeding.

- [ ] **Step 4: Decide loop exit**

- If either skill reported actionable findings: go back to Step 1.
- If both reported no findings: exit loop and commit.

- [ ] **Step 5: Commit**

```bash
git add -A
git diff --cached --stat
git commit -m "review: simplify + code-review feedback applied" || true
```

(May commit per iteration; one commit per loop iteration is fine.)

---

# Phase 13 — Open PR

### Task 13.1: Push and open PR

- [ ] **Step 1: Final pre-push verification**

```bash
pnpm check
pnpm build
pnpm exec playwright test
grep -E '"\^|"~' package.json && echo "FAIL CARETS PRESENT" && exit 1
pnpm audit --prod --audit-level=high
```

All must be clean.

- [ ] **Step 2: Push**

```bash
git push -u origin sveltekit-port
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "port: Next.js → SvelteKit (Svelte 5 runes)" --body "$(cat <<'EOF'
## Summary
- Full port from Next.js 16 / React 19 to SvelteKit (Svelte 5 runes) on `@sveltejs/adapter-vercel` (Node, Fluid Compute).
- Pruned dead surface: dropped `/signal`, `/source`, `/resonance`, all `/case-studies/*`, `/anything-but-analog/raw/[slug]`, and the entire audio-reactive subsystem (UI was setting state nothing visual read after `components/hero/*` was orphaned).
- All deps exact-pinned (no `^` or `~`); zero high/critical CVEs on prod deps.

## Test plan
- [ ] CI / preview deploy green
- [ ] Smoke: `pnpm test:smoke` — every kept route 200 + marker visible + no console errors
- [ ] Visual diff: `pnpm test:visual` — within `maxDiffPixelRatio: 0.005` of Next baseline on every kept route (mobile + desktop)
- [ ] Lighthouse: `pnpm lh` — all categories ≥ Next baseline on every kept route (results in `docs/lighthouse/`)
- [ ] Manual eyeball on each route in the preview deployment
- [ ] Confirm `/api/counters` GET + POST behave identically to current

## Changes worth a callout
- Nav reduced to `threesam` → `/` + `studio ↗`
- 31 sketches under `/anything-but-analog/[slug]` ported one-for-one
- `/canvas/[handle]` collapsed to static `/canvas/self`
- WASM and Rust unchanged
- Counter store still ephemeral filesystem (Vercel-side limitation — out of scope to fix)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return the PR URL to the user.**

---

## Self-review checklist (run before declaring the plan ready)

- [ ] Every spec section in `2026-05-17-sveltekit-migration-design.md` has at least one task implementing it
- [ ] No `TBD`, `TODO`, `implement later`, or `add appropriate ...` placeholders in step bodies
- [ ] Method/file names referenced across tasks match (e.g. `incrementCounter` exists where called)
- [ ] No task references a route or component that an earlier task didn't create/move
- [ ] Each verification step has a clear pass/fail (exit code, grep output, visible text)
