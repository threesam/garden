import { SITE_URL } from '$lib/seo';

// NOT prerendered: prerender serialises this route to a file with no
// extension, then serves it as text/html — losing the
// application/linkset+json Content-Type the spec wants. Serving live
// keeps the header intact. The handler is cheap (static JSON) so the
// SSR overhead is negligible.

// RFC 9728 API Catalog (linkset format). Lists the machine-readable
// content surfaces that agents can fetch. For a content site these are
// llms.txt + sitemap + robots.txt rather than OpenAPI specs.
//
// Format: linkset (application/linkset+json) per RFC 9264.
export function GET() {
	const linkset = {
		linkset: [
			{
				anchor: `${SITE_URL}/`,
				'service-desc': [
					{
						href: `${SITE_URL}/llms.txt`,
						type: 'text/plain',
						title: 'LLM-friendly site index (llmstxt.org)',
					},
					{
						href: `${SITE_URL}/sitemap.xml`,
						type: 'application/xml',
						title: 'XML sitemap of every indexable URL',
					},
					{
						href: `${SITE_URL}/robots.txt`,
						type: 'text/plain',
						title: 'Crawl permissions + Content-Signal directives',
					},
					{
						href: `${SITE_URL}/.well-known/agent.json`,
						type: 'application/json',
						title: 'A2A Agent Card — content surface descriptor',
					},
					{
						href: `${SITE_URL}/dad.md`,
						type: 'text/markdown',
						title: 'Long-form essay: dad (raw markdown)',
					},
					{
						href: `${SITE_URL}/benny.md`,
						type: 'text/markdown',
						title: 'Long-form essay: benny (raw markdown)',
					},
					{
						href: `${SITE_URL}/self.md`,
						type: 'text/markdown',
						title: 'Long-form essay: self (raw markdown)',
					},
				],
			},
		],
	};

	return new Response(JSON.stringify(linkset, null, 2), {
		headers: { 'Content-Type': 'application/linkset+json; charset=utf-8' },
	});
}
