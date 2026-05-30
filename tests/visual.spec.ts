import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

async function freezePage(page: import('@playwright/test').Page) {
  // Freeze JS-driven RAF animations by replacing rAF with a no-op after one frame
  await page.addInitScript(() => {
    const originalRAF = window.requestAnimationFrame.bind(window);
    let frozen = false;
    (window as any).__freezeRAF = () => { frozen = true; };
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
// /sounds is being rebuilt (functional Phase 1, unstyled) — we do NOT re-baseline
// an interim look. Re-enable once it's styled (Phase 3) and prod is updated.
const SKIP_VISUAL_PARITY = new Set(['sounds']);

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
      await page.evaluate(() => { (window as any).__freezeRAF?.(); });
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
      ];

      const fullPage = !VIEWPORT_ONLY_LABELS.has(label);

      await expect(page).toHaveScreenshot(`${label}.png`, {
        fullPage,
        mask: masks,
        // Allow small pixel variance for remaining dynamic content
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  test('aba-first-sketch /anything-but-analog/<first>', async ({ page }) => {
    // Navigate directly to the first visible sketch (slug "30")
    await freezePage(page);
    await page.goto('/anything-but-analog/30', { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
    });
    await page.evaluate(() => { (window as any).__freezeRAF?.(); });
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
