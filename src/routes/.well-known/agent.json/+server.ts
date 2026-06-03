import { SITE_URL, SITE_DESCRIPTION, PERSON_NAME, PERSON_ALT, SITE_PAGES } from '$lib/seo';

export const prerender = true;

// A2A Agent Card per the A2A spec (agent2agent.dev). Declares this as a
// passive content surface — the "skills" are honest HTTP GETs over the
// content surfaces (llms.txt, raw markdown, sitemap), not an
// interactive agent endpoint. Lives at both /.well-known/agent.json and
// /.well-known/agent-card.json (canonical A2A path).

const MARKDOWN_PATHS = new Set(['/dad', '/benny', '/self']);

export function GET() {
	const pages = SITE_PAGES.map((p) => {
		const page: Record<string, unknown> = {
			name: p.label,
			url: `${SITE_URL}${p.path}`,
			description: p.blurb,
		};
		if (MARKDOWN_PATHS.has(p.path)) page.markdownUrl = `${SITE_URL}${p.path}.md`;
		return page;
	});

	const card = {
		schemaVersion: '0.1',
		version: '0.1.0',
		name: 'threesam',
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		surface: 'content',
		owner: {
			name: PERSON_NAME,
			alternateName: PERSON_ALT,
			url: SITE_URL,
		},
		supportedInterfaces: [
			{
				type: 'http',
				url: SITE_URL,
				description: 'Public HTTP — read pages, markdown, sitemap, llms.txt.',
			},
		],
		skills: [
			{
				id: 'fetch-llms-txt',
				name: 'Fetch site digest',
				description: 'Return the LLM-friendly site index (llmstxt.org format).',
				method: 'GET',
				url: `${SITE_URL}/llms.txt`,
			},
			{
				id: 'fetch-sitemap',
				name: 'Fetch sitemap',
				description: 'Return the XML sitemap of every indexable URL.',
				method: 'GET',
				url: `${SITE_URL}/sitemap.xml`,
			},
			{
				id: 'fetch-essay-markdown',
				name: 'Fetch raw essay markdown',
				description:
					'Return raw markdown for long-form essays (no HTML frame). One URL per page.',
				method: 'GET',
				urls: Array.from(MARKDOWN_PATHS).map((p) => `${SITE_URL}${p}.md`),
			},
			{
				id: 'fetch-page',
				name: 'Fetch a page',
				description:
					'Return the canonical HTML for any public page. JSON-LD @graph in the head includes Person + WebSite + page-specific schema.',
				method: 'GET',
				urls: SITE_PAGES.map((p) => `${SITE_URL}${p.path}`),
			},
		],
		contentIndex: {
			llmsTxt: `${SITE_URL}/llms.txt`,
			sitemap: `${SITE_URL}/sitemap.xml`,
			robots: `${SITE_URL}/robots.txt`,
			apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
		},
		pages,
		license:
			'Content available for AI training, search indexing, and citation. See robots.txt Content-Signal.',
	};

	return new Response(JSON.stringify(card, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
