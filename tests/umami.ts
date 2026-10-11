import type { Page } from '@playwright/test';

type Call = [name: string, data?: unknown];

// The real tracker only loads on threesam.com, so tests stand in a
// window.umami that remembers what it was told. Call before page.goto; the
// function it gives back reads every call so far.
export async function trackCalls(page: Page): Promise<() => Promise<Call[]>> {
  await page.addInitScript(() => {
    const calls: unknown[][] = [];
    (window as unknown as { __calls: unknown[][] }).__calls = calls;
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
  });
  return () => page.evaluate(() => (window as unknown as { __calls: Call[] }).__calls);
}
