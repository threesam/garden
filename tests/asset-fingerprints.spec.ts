import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// /assets and /wasm are cached for a year, so every file from them has to
// carry a fingerprint of its own bytes or a changed one never reaches a
// returning visitor. These pages cover each way an address gets its stamp:
// written in a component, in a data file, in a srcset, and in an essay, which
// is stamped as it is read.
const fingerprint = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex').slice(0, 8);

for (const path of ['/thoughts', '/benny', '/deana', '/thoughts/mouth-machine', '/thoughts/mouth-machine/raw']) {
  test(`every picture on ${path} carries its fingerprint`, async ({ page, request }) => {
    await page.goto(path);
    const srcs = await page.locator('img').evaluateAll((imgs) =>
      imgs
        .flatMap((img) => [
          img.getAttribute('src') ?? '',
          ...(img.getAttribute('srcset') ?? '').split(',').map((candidate) => candidate.trim().split(' ')[0] ?? ''),
        ])
        .filter((src) => src.startsWith('/assets/')),
    );
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      const file = src.replace(/\?.*$/, '');
      expect(src).toBe(`${file}?v=${fingerprint(readFileSync(`static${file}`))}`);
    }
    expect((await request.get(srcs[0] ?? '')).ok()).toBe(true);
  });
}

test('the physarum plate fetches its wasm by fingerprint', async ({ page }) => {
  const wasm = page.waitForResponse((r) => r.url().includes('/wasm/garden_math.wasm'));
  await page.goto('/anything-but-analog/physarum');
  const response = await wasm;
  expect(response.ok()).toBe(true);
  expect(new URL(response.url()).search).toBe(`?v=${fingerprint(await response.body())}`);
});
