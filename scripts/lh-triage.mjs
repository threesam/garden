// One-off Lighthouse runner that captures full audit results per route
// so we can triage what's actually broken vs. what the platform graded
// down for stylistic reasons. Output: lh-triage.json + a printed table.

import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { writeFileSync } from "node:fs";

const PORT = Number(process.env.LH_PORT ?? 4173);
const ROUTES = [
  "/",
  "/shelf",
  "/sounds",
  "/thoughts",
  "/dad",
  "/deana",
  "/benny",
  "/anything-but-analog",
  "/self",
];

const chrome = await launch({
  chromeFlags: ["--headless=new", "--no-sandbox"],
});

const opts = {
  port: chrome.port,
  output: "json",
  logLevel: "error",
  onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
};

const summary = [];
const dump = {};

for (const route of ROUTES) {
  const url = `http://localhost:${PORT}${route}`;
  try {
    const runner = await lighthouse(url, opts);
    const lhr = runner.lhr;
    const c = lhr.categories;

    const auditList = Object.entries(lhr.audits)
      .filter(([_, a]) => a.score !== null && a.score < 0.9)
      .map(([id, a]) => ({
        id,
        title: a.title,
        score: Math.round(a.score * 100),
        displayValue: a.displayValue ?? "",
        description: a.description?.slice(0, 200) ?? "",
      }))
      .sort((a, b) => a.score - b.score);

    summary.push({
      route,
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      worstAudits: auditList.slice(0, 5).map((a) => `${a.score}: ${a.id}`),
    });

    dump[route] = {
      categoryScores: {
        perf: Math.round(c.performance.score * 100),
        a11y: Math.round(c.accessibility.score * 100),
        bp: Math.round(c["best-practices"].score * 100),
        seo: Math.round(c.seo.score * 100),
      },
      metrics: {
        fcp: lhr.audits["first-contentful-paint"]?.displayValue,
        lcp: lhr.audits["largest-contentful-paint"]?.displayValue,
        tbt: lhr.audits["total-blocking-time"]?.displayValue,
        cls: lhr.audits["cumulative-layout-shift"]?.displayValue,
        si: lhr.audits["speed-index"]?.displayValue,
      },
      failedAudits: auditList,
    };
  } catch (err) {
    summary.push({ route, error: String(err) });
  }
}

await chrome.kill();
console.table(summary);
writeFileSync("lh-triage.json", JSON.stringify(dump, null, 2));
console.log("\nFull dump → lh-triage.json");
