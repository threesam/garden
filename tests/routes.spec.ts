import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

const ROUTE_MARKERS: Record<string, string> = {
  '/':                              'threesam',
  '/shelf':                         'shelf',
  '/sounds':                        'coming soon',
  '/thoughts':                      'work in progress',
  '/dad':                           'dad',
  '/deana':                         'deana',
  '/benny':                         '102 Jackson Street',
  '/anything-but-analog':           'THREESAM',
  '/self':                          'self',
};

test.describe('smoke', () => {
  for (const { path } of KEPT_ROUTES) {
    test(`200 + marker visible: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() !== 'error') return;
        const text = m.text();
        // Ignore macOS browser-internal media controls icon errors (not app code)
        if (text.startsWith('Button failed to load, iconName =')) return;
        errors.push(text);
      });
      const resp = await page.goto(path);
      expect(resp?.status()).toBe(200);
      const marker = ROUTE_MARKERS[path];
      if (marker) await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
      expect(errors, `console errors on ${path}: ${errors.join('\n')}`).toEqual([]);
    });
  }
});
