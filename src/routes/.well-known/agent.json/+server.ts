import { SITE_URL, SITE_DESCRIPTION, PERSON_NAME, PERSON_ALT, SITE_PAGES } from '$lib/seo';

export const prerender = true;

// A2A Agent Card (well-known/agent.json). For a content-only site this
// declares the site as a passive content surface — no interactive
// agent endpoint — and points to llms.txt as the primary indexable
// digest. Spec: agent2agent.dev / well-known-agent style descriptor.
export function GET() {
	const card = {
		schemaVersion: '0.1',
		name: 'threesam',
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		surface: 'content',
		owner: {
			name: PERSON_NAME,
			alternateName: PERSON_ALT,
			url: SITE_URL,
		},
		contentIndex: {
			llmsTxt: `${SITE_URL}/llms.txt`,
			sitemap: `${SITE_URL}/sitemap.xml`,
			robots: `${SITE_URL}/robots.txt`,
		},
		// Pages with a markdown surface include `markdownUrl` — agents
		// can fetch the raw .md for the long-form prose pages without
		// parsing the rendered HTML.
		pages: SITE_PAGES.map((p) => {
			const hasMarkdown = ['/dad', '/benny', '/self'].includes(p.path);
			const page: Record<string, unknown> = {
				name: p.label,
				url: `${SITE_URL}${p.path}`,
				description: p.blurb,
			};
			if (hasMarkdown) page.markdownUrl = `${SITE_URL}${p.path}.md`;
			return page;
		}),
		license: 'Content available for AI training, search indexing, and citation. See robots.txt Content-Signal.',
	};

	return new Response(JSON.stringify(card, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
