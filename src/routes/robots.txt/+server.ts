import { SITE_URL } from '$lib/seo';

export const prerender = true;

export async function GET() {
  const body = `# All crawlers, including AI and answer engines, are welcome.
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
