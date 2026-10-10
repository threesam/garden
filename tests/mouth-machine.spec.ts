import { test, expect } from '@playwright/test';

// Playwright's Chromium ships without the AAC decoder, so this checks the press
// reaches the file and the file is served, not that it is heard.
test('the memo picture plays the memo', async ({ page }) => {
  await page.goto('/thoughts/mouth-machine');
  const sound = page.waitForResponse((r) => r.url().endsWith('/assets/mouth-machine/take-1-beat.m4a'));
  await page.getByRole('button', { name: /play the sound/ }).click();
  expect((await sound).ok()).toBe(true);
});
