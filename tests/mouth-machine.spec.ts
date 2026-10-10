import { test, expect } from '@playwright/test';

// Playwright's Chromium ships without the AAC decoder, so this checks the press
// reaches the file and the file is served, not that it is heard.
test('the memo picture plays the memo', async ({ page }) => {
  await page.goto('/thoughts/mouth-machine');
  const sound = page.waitForResponse((r) => r.url().endsWith('/assets/mouth-machine/take-1-beat.m4a'));
  await page.getByRole('button', { name: /play the sound/ }).click();
  expect((await sound).ok()).toBe(true);
});

// The page has two modes, olive and light. In each, the ink and the small-text
// colour have to clear 4.5:1 on the ground (WCAG AA for body text).
for (const colorScheme of ['dark', 'light'] as const) {
  test(`${colorScheme} mode keeps its text readable`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/thoughts/mouth-machine');
    const ratios = await page.locator('main').evaluate((main) => {
      const style = getComputedStyle(main);
      const luminance = (name: string): number => {
        const hex = style.getPropertyValue(name).trim().slice(1);
        const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
          const v = parseInt(hex.slice(i, i + 2), 16) / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ground = luminance('--ground');
      return ['--ink', '--soft'].map((name) => {
        const text = luminance(name);
        return (Math.max(text, ground) + 0.05) / (Math.min(text, ground) + 0.05);
      });
    });
    expect(ratios).toHaveLength(2);
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}
