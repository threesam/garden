import { test, expect, type Page } from '@playwright/test';
import { trackCalls } from './umami';

// src/lib/engagement.js, in a real browser: what a visitor did after the page
// loaded. One page stands for all of them, since the layout mounts it once.
const PAGE = '/thoughts/mouth-machine';

const named = async (page: Page, prefix: string) => {
  const calls = await trackCalls(page);
  return async () => (await calls()).filter(([name]) => name.startsWith(prefix));
};

const toTheEnd = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

test('scroll depth: each quarter once per page, and again on the next page', async ({ page }) => {
  const scrolls = await named(page, 'scroll-');
  const quarters = ['scroll-25', 'scroll-50', 'scroll-75', 'scroll-100'].map((name) => [name]);
  await page.goto(PAGE);
  await page.waitForTimeout(300);
  expect(await scrolls(), 'fired on load').toEqual([]);

  await toTheEnd(page);
  await expect.poll(scrolls).toEqual(quarters);

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await toTheEnd(page);
  await page.waitForTimeout(300);
  expect(await scrolls(), 'counted twice').toHaveLength(4);

  // The switch changes page without loading a new document.
  await page.getByRole('link', { name: 'raw', exact: true }).click();
  await expect(page).toHaveURL(/\/raw$/);
  await toTheEnd(page);
  await expect.poll(scrolls).toEqual([...quarters, ...quarters]);
});

test('time in view: marks at ten and thirty seconds', async ({ page }) => {
  const engaged = await named(page, 'engaged-');
  await page.clock.install();
  await page.goto(PAGE);
  await page.clock.runFor(9_000);
  expect(await engaged()).toEqual([]);
  await page.clock.runFor(22_000);
  expect(await engaged()).toEqual([['engaged-10s'], ['engaged-30s']]);
});

// A second of silence as a WAV, which every browser here can play (Playwright's
// Chromium has no AAC or H.264). Started from a real click, as sound must be.
const addSound = (page: Page, muted: boolean) =>
  page.evaluate((muted) => {
    const rate = 8000;
    const bytes = new Uint8Array(44 + rate).fill(128);
    const view = new DataView(bytes.buffer);
    const text = (at: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
    };
    text(0, 'RIFF');
    view.setUint32(4, 36 + rate, true);
    text(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    text(36, 'data');
    view.setUint32(40, rate, true);
    const audio = Object.assign(document.createElement('audio'), {
      src: URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })),
      muted,
    });
    const button = Object.assign(document.createElement('button'), { textContent: 'test sound' });
    button.style.cssText = 'position:fixed;top:0;left:0;z-index:99999';
    button.onclick = () => void audio.play();
    document.body.append(audio, button);
  }, muted);

// The tracker loads after the page, so a visitor can get somewhere first.
test('what happened before the tracker loaded is told once it has', async ({ page }) => {
  await page.goto(PAGE);
  await toTheEnd(page);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const calls: unknown[][] = [];
    (window as unknown as { __calls: unknown[][] }).__calls = calls;
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
    window.scrollBy(0, -1);
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __calls: unknown[][] }).__calls))
    .toEqual([['scroll-25'], ['scroll-50'], ['scroll-75'], ['scroll-100']]);
});

test('a player that moves to another file starts again', async ({ page }) => {
  const media = await named(page, 'media-');
  await page.goto(PAGE);
  await addSound(page, false);
  const play = page.getByRole('button', { name: 'test sound' });
  await play.click();
  await expect.poll(async () => (await media()).length).toBe(5);
  // The same bytes at a new address: to the page, a different file.
  await page.evaluate(async () => {
    const audio = document.querySelector<HTMLAudioElement>('audio[src^="blob:"]');
    if (!audio) throw new Error('no test sound');
    audio.src = URL.createObjectURL(await (await fetch(audio.src)).blob());
  });
  await play.click();
  await expect
    .poll(async () => (await media()).slice(5).map(([name]) => name))
    .toEqual(['media-play', 'media-25', 'media-50', 'media-75', 'media-end']);
});

test('a sound played to its end is followed all the way', async ({ page }) => {
  const media = await named(page, 'media-');
  await page.goto(PAGE);
  await addSound(page, false);
  await page.getByRole('button', { name: 'test sound' }).click();
  await expect
    .poll(async () => (await media()).map(([name]) => name))
    .toEqual(['media-play', 'media-25', 'media-50', 'media-75', 'media-end']);
  expect((await media())[0]?.[1]).toHaveProperty('src');
});

test('a muted sound is decoration and is not followed', async ({ page }) => {
  const media = await named(page, 'media-');
  await page.goto(PAGE);
  await addSound(page, true);
  await page.getByRole('button', { name: 'test sound' }).click();
  await page.waitForTimeout(1500);
  expect(await media()).toEqual([]);
});

test('a link off the site is counted, a link within it is not', async ({ page }) => {
  const outbound = await named(page, 'outbound-');
  await page.goto(PAGE);
  await page.evaluate(() => {
    for (const href of ['https://example.com/there?x=1', '/thoughts']) {
      const a = Object.assign(document.createElement('a'), { href });
      a.addEventListener('click', (event) => {
        event.preventDefault();
      });
      document.body.append(a);
      a.click();
    }
  });
  expect(await outbound()).toEqual([
    ['outbound-click', { host: 'example.com', path: '/there', from: PAGE }],
  ]);
});
