import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

declare global {
  interface Window {
    __freezeRAF?: () => void;
  }
}

async function freezePage(page: import('@playwright/test').Page) {
  // Freeze JS-driven RAF animations by replacing rAF with a no-op after one frame
  await page.addInitScript(() => {
    const originalRAF = window.requestAnimationFrame.bind(window);
    let frozen = false;
    window.__freezeRAF = () => { frozen = true; };
    window.requestAnimationFrame = (cb) => {
      if (frozen) return 0;
      return originalRAF(cb);
    };
  });
}

// Routes where the full-page height is unstable due to content-visibility: auto
// reflow when Playwright disables animations. For these we capture viewport only.
const VIEWPORT_ONLY_LABELS = new Set(['self']);

// Routes under active redesign whose prod baseline is intentionally stale.
// Empty: /sounds is shipped and re-baselined against prod (its canvas backdrop is
// masked below, so the eye motion doesn't destabilize the shot).
const SKIP_VISUAL_PARITY = new Set<string>([]);

test.describe('visual parity', () => {
  for (const { path, label } of KEPT_ROUTES) {
    test(`${label} ${path}`, async ({ page }) => {
      test.skip(SKIP_VISUAL_PARITY.has(label), `${label} under active redesign — re-enable after Phase 3 styling + prod update`);
      await freezePage(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
          /* Stabilize content-visibility: auto sections */
          [style*="content-visibility"] {
            content-visibility: visible !important;
            contain-intrinsic-size: none !important;
          }
        `,
      });
      // Freeze RAF after initial render
      await page.evaluate(() => { window.__freezeRAF?.(); });
      // Wait for all images to settle (with 8s timeout per image)
      await page.evaluate(() => {
        const timeout = (ms: number) => new Promise((r) => setTimeout(r, ms));
        return Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : Promise.race([
                  new Promise((r) => { img.onload = r; img.onerror = r; }),
                  timeout(8000),
                ])
          )
        );
      });
      await page.waitForTimeout(800);

      // Mask all canvas elements, voronoi banner wrappers (dynamic aspect
      // ratio), the gallery carousel strip (card positions are
      // animation-frame-dependent even after RAF freeze), and iframes
      // (Spotify embeds load asynchronously and vary by network state).
      const masks = [
        ...await page.locator('canvas').all(),
        ...await page.locator('.voronoi-banner').all(),
        ...await page.locator('[data-gallery-strip]').all(),
        ...await page.locator('iframe').all(),
        // /sounds renders ~40 remotely-hosted cover images. They decode with
        // slight sub-pixel variance run to run, which put the page at ~8% diff
        // while being pixel-for-pixel indistinguishable by eye — so it failed
        // even immediately after being re-baselined. Same class of problem as
        // the iframes above: async remote content, not a rendering signal.
        ...(label === 'sounds' ? await page.locator('.card img, .grid img').all() : []),
      ];

      const fullPage = !VIEWPORT_ONLY_LABELS.has(label);

      await expect(page).toHaveScreenshot(`${label}.png`, {
        fullPage,
        mask: masks,
        // Allow small pixel variance for remaining dynamic content
        maxDiffPixelRatio: 0.02,
      });

      // /thoughts' backdrop canvas is full-bleed and stays non-deterministic
      // even with rAF frozen, so it has to be masked — and Playwright masks by
      // bounding box, not z-order, which blanks the entire page. The full-page
      // shot above is therefore 100% magenta and only ever asserted the page's
      // height.
      //
      // Snapshot each card individually to give the route real coverage. Per
      // CARD, not the grid: the grid's gaps let the non-deterministic backdrop
      // show through, which put it at 0.03 diff against a 0.02 tolerance. A
      // card's own box is fully covered by its image, so nothing bleeds in.
      const cards = page.locator('[data-thought-cards] > a');
      const cardCount = await cards.count();
      for (let i = 0; i < cardCount; i++) {
        await expect(cards.nth(i)).toHaveScreenshot(`${label}-card-${i}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      }
    });
  }

  test('aba-first-sketch /anything-but-analog/<first>', async ({ page }) => {
    // Navigate directly to the first visible sketch (slug "30")
    await freezePage(page);
    await page.goto('/anything-but-analog/30', { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
    });
    await page.evaluate(() => { window.__freezeRAF?.(); });
    await page.waitForTimeout(600);

    const masks = [
      ...await page.locator('canvas').all(),
      ...await page.locator('.voronoi-banner').all(),
    ];

    await expect(page).toHaveScreenshot('aba-sketch.png', {
      fullPage: true,
      mask: masks,
      maxDiffPixelRatio: 0.02,
    });
  });
});
