import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'node:fs';

const BASE = process.env.LH_BASE ?? 'http://localhost:3000';
const ROUTES = [
  '/',
  '/shelf',
  '/sounds',
  '/thoughts',
  '/dad',
  '/deana',
  '/benny',
  '/anything-but-analog',
  '/self',
];

const chrome = await launch({ chromeFlags: ['--headless=new'] });
const opts = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
const results = [];

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  try {
    const r = await lighthouse(url, opts);
    const c = r.lhr.categories;
    results.push({
      route,
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp:   Math.round(c['best-practices'].score * 100),
      seo:  Math.round(c.seo.score * 100),
    });
    console.error(`OK  ${url}`);
  } catch (err) {
    results.push({ route, error: String(err) });
    console.error(`ERR ${url}: ${err}`);
  }
}

await chrome.kill();
console.table(results);
writeFileSync(process.env.LH_OUTPUT ?? 'lighthouse-results.json', JSON.stringify(results, null, 2));
