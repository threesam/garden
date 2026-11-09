import { visibleSketches } from '#lib/art/registry.js';
import { SITE_URL, SITE_PAGES } from '#lib/seo.js';

export const prerender = true;

// Each essay with the date its words last changed. Bump it with the edit.
const ESSAYS: { path: string; lastmod: string }[] = [
  { path: '/thoughts/the-peach', lastmod: '2026-06-09' },
  { path: '/thoughts/certainly-uncertain', lastmod: '2026-06-29' },
  { path: '/thoughts/mouth-machine', lastmod: '2026-10-11' },
  { path: '/thoughts/mouth-machine/raw', lastmod: '2026-10-10' },
  { path: '/thoughts/love-bombed', lastmod: '2026-10-13' },
  { path: '/thoughts/love-bombed/raw', lastmod: '2026-10-13' },
];

export function GET() {
  // Only emit <lastmod> where we have a real content date; stamping every
  // static route with the build time is meaningless and search engines learn
  // to distrust it. /thoughts changes when an essay does.
  const newestEssay = ESSAYS.map((e) => e.lastmod).sort().at(-1);
  const entries: { url: string; lastmod?: string | undefined }[] = [
    { url: `${SITE_URL}/` },
    ...SITE_PAGES.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastmod: p.path === '/thoughts' ? newestEssay : p.lastmod,
    })),
    ...visibleSketches.map((s) => ({
      url: `${SITE_URL}/anything-but-analog/${s.slug}`,
      lastmod: s.date ? new Date(s.date).toISOString() : undefined,
    })),
    { url: `${SITE_URL}/anything-but-analog/physarum` },
    ...ESSAYS.map((e) => ({ url: `${SITE_URL}${e.path}`, lastmod: e.lastmod })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : '';
    return `  <url><loc>${e.url}</loc>${lastmod}</url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
