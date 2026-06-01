import { test, expect } from '@playwright/test';
import { KEPT_ROUTES } from './routes';

const ROUTE_MARKERS: Record<string, string> = {
  '/':                              'threesam',
  '/shelf':                         'shelf',
  '/sounds':                        'sounds',
  '/thoughts':                      'thoughts',
  '/dad':                           'dad',
  '/deana':                         'deana',
  '/benny':                         '102 Jackson Street',
  '/anything-but-analog':           'go home',
  '/self':                          'self',
};

// Patterns to ignore in console errors — they're environment artifacts,
// not real app issues:
//   - macOS browser-internal media-controls icon errors
//   - /sounds cover images live on R2 (PUBLIC_SOUNDS_BASE), unset in
//     preview so the cover URLs 404. Prod has the var set.
function isEnvironmentNoise(text: string): boolean {
  if (text.startsWith('Button failed to load, iconName =')) return true;
  if (text.includes('/audio/sounds/covers/') && text.includes('404')) return true;
  if (text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') {
    return true;
  }
  return false;
}

test.describe('smoke', () => {
  for (const { path } of KEPT_ROUTES) {
    test(`200 + marker visible: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() !== 'error') return;
        const text = m.text();
        if (isEnvironmentNoise(text)) return;
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
