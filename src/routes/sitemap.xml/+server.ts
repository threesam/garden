import { visibleSketches } from '$lib/art/registry';
import { SITE_URL } from '$lib/seo';

const STATIC_ROUTES = [
  '/',
  '/canvas/self',
  '/shelf',
  '/sounds',
  '/thoughts',
  '/dad',
  '/deana',
  '/benny',
  '/anything-but-analog',
];

export const prerender = true;

export async function GET() {
  const now = new Date().toISOString();
  const entries: Array<{ url: string; lastmod: string }> = [
    ...STATIC_ROUTES.map((p) => ({ url: `${SITE_URL}${p}`, lastmod: now })),
    ...visibleSketches.map((s) => ({
      url: `${SITE_URL}/anything-but-analog/${s.slug}`,
      lastmod: s.date ? new Date(s.date).toISOString() : now,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.url}</loc><lastmod>${e.lastmod}</lastmod></url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
