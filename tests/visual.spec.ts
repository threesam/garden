import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

test.describe('visual parity', () => {
  for (const { path, label } of KEPT_ROUTES) {
    test(`${label} ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
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
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`${label}.png`, { fullPage: true });
    });
  }

  test('aba-first-sketch /anything-but-analog/<first>', async ({ page }) => {
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
