import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'node:fs';

const PORT = Number(process.env.LH_PORT ?? 3000);
const ROUTES = [
  '/',
  '/shelf',
  '/sounds',
  '/thoughts',
  '/dad',
  '/deana',
  '/benny',
  '/anything-but-analog',
  '/canvas/self',
];

const chrome = await launch({ chromeFlags: ['--headless=new'] });
const opts = {
  port: chrome.port,
  output: 'json',
  logLevel: 'error',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};
const results = [];

for (const route of ROUTES) {
  const url = `http://localhost:${PORT}${route}`;
  try {
    const runner = await lighthouse(url, opts);
    const cats = runner.lhr.categories;
    results.push({
      route,
      perf: Math.round(cats.performance.score * 100),
      a11y: Math.round(cats.accessibility.score * 100),
      bp:   Math.round(cats['best-practices'].score * 100),
      seo:  Math.round(cats.seo.score * 100),
    });
  } catch (err) {
    results.push({ route, error: String(err) });
  }
}

await chrome.kill();
console.table(results);
writeFileSync(process.env.LH_OUTPUT ?? 'lighthouse-results.json', JSON.stringify(results, null, 2));
