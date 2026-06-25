import { visibleSketches } from '$lib/art/registry';
import { SITE_URL, SITE_PAGES } from '$lib/seo';

// Home + the shared content-page list (single source: SITE_PAGES in $lib/seo).
const STATIC_ROUTES = ['/', ...SITE_PAGES.map((p) => p.path)];

export const prerender = true;

export function GET() {
  // Only emit <lastmod> where we have a real content date; stamping every
  // static route with the build time is meaningless and search engines learn
  // to distrust it.
  const entries: { url: string; lastmod?: string }[] = [
    ...STATIC_ROUTES.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...visibleSketches.map((s) => ({
      url: `${SITE_URL}/anything-but-analog/${s.slug}`,
      lastmod: s.date ? new Date(s.date).toISOString() : undefined,
    })),
    {
      url: `${SITE_URL}/thoughts/the-peach`,
      lastmod: new Date('2026-06-09T00:00:00Z').toISOString(),
    },
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
