import { error } from '@sveltejs/kit';
import { getSketch, sketches } from '$lib/art/registry';

// Prerender a page for every sketch (including hidden ones — they're
// accessible via direct URL even if not in the gallery scroll).
export const prerender = true;

export const entries = () => sketches.map((s) => ({ slug: s.slug }));

export function load({ params }: { params: { slug: string } }) {
	const sketch = getSketch(params.slug);
	if (!sketch) throw error(404, 'sketch not found');
	// Return only serializable metadata — the setup function cannot cross the
	// server→client boundary. The page component looks up the full Sketch
	// object from the registry (plain TS, bundled client-side).
	return {
		slug: sketch.slug,
		title: sketch.title,
		date: sketch.date,
		description: sketch.description ?? null,
	};
}
