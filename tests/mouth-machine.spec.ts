import { test, expect } from '@playwright/test';

test('the memo picture plays the memo', async ({ page }) => {
  await page.goto('/thoughts/mouth-machine');
  const sound = page.waitForRequest(/take-1-beat\.m4a$/);
  await page.getByRole('button', { name: /play or stop the sound/ }).click();
  expect((await sound).url()).toContain('/assets/mouth-machine/take-1-beat.m4a');
});
