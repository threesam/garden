import { test, expect } from '@playwright/test';

// Playwright's Chromium ships without the AAC decoder, so this checks the press
// reaches the file and the file is served, not that it is heard.
test('the memo picture plays the memo', async ({ page }) => {
  await page.goto('/thoughts/mouth-machine');
  const sound = page.waitForResponse((r) => r.url().includes('/assets/mouth-machine/take-1-beat.m4a'));
  await page.getByRole('button', { name: /play the sound/ }).click();
  expect((await sound).ok()).toBe(true);
});

// The page has two modes, olive and light. In each, on both tellings, every
// line of running text, link and bit of code has to clear 4.5:1 on whatever is
// behind it (WCAG AA). The title sits on a picture and the switch slides its
// own ground under its labels, so neither is here.
const TEXT = 'article :is(p, figcaption, blockquote, h2, h3, li, th, td, code, p a, footer a)';
for (const colorScheme of ['dark', 'light'] as const) {
  for (const path of ['/thoughts/mouth-machine', '/thoughts/mouth-machine/raw']) {
    test(`${colorScheme} mode keeps ${path} readable`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      const ratios = await page.locator('main').evaluate((main, selector) => {
        const parts = (colour: string): number[] => (colour.match(/[\d.]+/g) ?? []).map(Number);
        const luminance = (colour: string): number => {
          const [r = 0, g = 0, b = 0] = parts(colour).map((n) => {
            const v = n / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        // The nearest ancestor that paints a ground; main always does.
        const behind = (el: Element): string => {
          const colour = getComputedStyle(el).backgroundColor;
          return parts(colour)[3] === 0 && el.parentElement ? behind(el.parentElement) : colour;
        };
        return [...main.querySelectorAll(selector)].map((el) => {
          const text = luminance(getComputedStyle(el).color);
          const ground = luminance(behind(el));
          return (Math.max(text, ground) + 0.05) / (Math.min(text, ground) + 0.05);
        });
      }, TEXT);
      expect(ratios.length).toBeGreaterThan(0);
      expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    });
  }
}
