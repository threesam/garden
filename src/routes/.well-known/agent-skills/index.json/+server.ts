import { SITE_URL } from '$lib/seo';

export const prerender = true;

// Agent Skills index (agentskills.io). For a content site the
// "skills" are read-only HTTP GETs over the existing surfaces — no
// SKILL.md folders, no scripts. This file lets scanners discover that
// the site exposes a skills index even though there's no callable
// extension.
export function GET() {
	const index = {
		schemaVersion: '0.1',
		skills: [
			{
				name: 'fetch-content',
				description:
					'Read the site\'s content. Use /llms.txt for an LLM-friendly index, /sitemap.xml for every URL, or .md sibling paths (e.g. /dad.md) for raw long-form essays.',
				surfaces: [
					{ name: 'llmsTxt', url: `${SITE_URL}/llms.txt`, type: 'text/plain' },
					{ name: 'sitemap', url: `${SITE_URL}/sitemap.xml`, type: 'application/xml' },
					{ name: 'agentCard', url: `${SITE_URL}/.well-known/agent-card.json`, type: 'application/json' },
				],
			},
			{
				name: 'fetch-essay-markdown',
				description: 'Return raw markdown for long-form essays without HTML frame.',
				surfaces: [
					{ name: 'dad', url: `${SITE_URL}/dad.md`, type: 'text/markdown' },
					{ name: 'benny', url: `${SITE_URL}/benny.md`, type: 'text/markdown' },
					{ name: 'self', url: `${SITE_URL}/self.md`, type: 'text/markdown' },
				],
			},
		],
		references: {
			agentCard: `${SITE_URL}/.well-known/agent-card.json`,
			apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
		},
	};

	return new Response(JSON.stringify(index, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
