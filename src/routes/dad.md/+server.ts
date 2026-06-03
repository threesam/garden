import { getContent } from '$lib/content';
import { error } from '@sveltejs/kit';

// Raw markdown surface for /dad — same content as the HTML route, no
// frame, served as text/markdown so AI agents can ingest it without
// parsing the rendered page. Discoverable via the api-catalog +
// agent.json descriptors at /.well-known.
export const prerender = true;

export async function GET() {
	const raw = await getContent('dad');
	if (raw == null) error(404);
	return new Response(raw, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
}
