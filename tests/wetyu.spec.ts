import { test, expect } from '@playwright/test';

// UI surface only: audio is not asserted here (house convention — Playwright
// can't hear, and the mic is opt-in). The engine has its own cargo tests.
test.describe('wetyu looper', () => {
  test('renders transport, three loops, keys and pads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/wetyu');
    await expect(page.getByRole('heading', { name: 'wetyu', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /^play/ })).toBeVisible();
    await expect(page.getByLabel('tempo')).toHaveValue('120');
    for (const name of ['mic', 'keys', 'drums']) {
      await expect(page.getByRole('button', { name: `${name} loop` })).toBeVisible();
      await expect(page.getByRole('button', { name: `record ${name}` })).toBeVisible();
      await expect(page.getByRole('button', { name: `on ${name}` })).toBeVisible();
    }
    await expect(page.getByRole('group', { name: 'keys' }).getByRole('button')).toHaveCount(13);
    await expect(page.getByRole('group', { name: 'drums' }).getByRole('button')).toHaveCount(10);
    await expect(page.getByRole('button', { name: 'enable mic' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('keys light on keydown and the selected loop advances with tab', async ({ page }) => {
    await page.goto('/wetyu');
    // Listeners attach on mount; the readout flips once the worklet is up.
    await expect(page.locator('.readout')).toContainText('ms out', { timeout: 15000 });
    const keyA = page.getByRole('group', { name: 'keys' }).getByRole('button', { name: 'A C', exact: true });
    await page.keyboard.down('KeyA');
    await expect(keyA).toHaveClass(/lit/);
    await page.keyboard.up('KeyA');
    await expect(keyA).not.toHaveClass(/lit/);
    // A tap latches the loop on; a second tap latches it off. Tab stays the browser's.
    const drums = page.getByRole('button', { name: /drums loop/ });
    await page.keyboard.press('Digit3');
    await expect(drums).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Digit3');
    await expect(drums).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveCount(1);
  });
});
