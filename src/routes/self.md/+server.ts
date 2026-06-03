import { getContent } from '$lib/content';
import { error } from '@sveltejs/kit';

export const prerender = true;

export async function GET() {
	const raw = await getContent('self');
	if (raw == null) error(404);
	return new Response(raw, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
}
