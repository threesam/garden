import { test, expect, type Page } from '@playwright/test';

// essay-read is the content site's conversion: which essays people finish, not
// just open. The real tracker only loads on threesam.com, so stub window.umami.
async function trackCalls(page: Page) {
  await page.addInitScript(() => {
    const calls: unknown[][] = [];
    (window as unknown as { __calls: unknown[][] }).__calls = calls;
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
  });
  return () =>
    page.evaluate(() =>
      (window as unknown as { __calls: [string, unknown][] }).__calls.filter(
        ([name]) => name === 'essay-read',
      ),
    );
}

const ESSAYS = ['/thoughts/the-peach', '/thoughts/certainly-uncertain', '/self', '/dad', '/benny'];

for (const path of ESSAYS) {
  test(`${path} fires essay-read once, only after scrolling to the end`, async ({ page }) => {
    const reads = await trackCalls(page);
    await page.goto(path);
    await page.waitForTimeout(300);
    expect(await reads(), 'fired on load').toHaveLength(0);

    await page.locator('[data-read-mark]').scrollIntoViewIfNeeded();
    await expect.poll(reads).toEqual([['essay-read', { path }]]);

    // once per page view: scrolling back past the end doesn't double-count
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.locator('[data-read-mark]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await reads()).toHaveLength(1);
  });
}

// The layout injects umami async, so a reader can hit the end first and then
// sit there. The tracker isn't injected off threesam.com: stand in a script
// tag that hasn't loaded yet, then "load" it without scrolling again.
test('a finish before umami loads counts when it arrives', async ({ page }) => {
  await page.goto('/thoughts/the-peach');
  await page.evaluate(() => {
    const script = Object.assign(document.createElement('script'), { type: 'text/x-pending' });
    script.dataset['websiteId'] = 'test';
    document.head.append(script);
  });
  await page.locator('[data-read-mark]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const calls: unknown[][] = [];
    (window as unknown as { __calls: unknown[][] }).__calls = calls;
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
    document.querySelector('script[data-website-id]')?.dispatchEvent(new Event('load'));
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __calls: unknown[][] }).__calls))
    .toEqual([['essay-read', { path: '/thoughts/the-peach' }]]);
});
