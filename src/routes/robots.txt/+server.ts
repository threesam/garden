import { SITE_URL } from '$lib/seo';

export const prerender = true;

export async function GET() {
  const body = `User-Agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
Host: ${SITE_URL}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
