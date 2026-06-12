<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Keeps the URL hash in sync with the currently-centered scroll-snap section,
	 * and scrolls to a hash on mount (so /art#3 lands on the day-3 section).
	 * Renders nothing — purely a side-effect component.
	 */
	onMount(() => {
		const scroller = document.getElementById('art-scroller');
		if (!scroller) return;
		const sections = Array.from(
			scroller.querySelectorAll<HTMLElement>('section[data-art-slug]'),
		);
		if (sections.length === 0) return;

		const initialHash = window.location.hash.replace(/^#/, '');
		if (initialHash) {
			const target = sections.find((s) => s.dataset['artSlug'] === initialHash);
			if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
		}

		let currentSlug = initialHash || sections[0]!.dataset['artSlug']!;
		const visibility = new Map<string, number>();

		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const slug = (entry.target as HTMLElement).dataset['artSlug'];
					if (!slug) continue;
					visibility.set(slug, entry.intersectionRatio);
				}
				let best: string | null = null;
				let bestRatio = 0;
				for (const [slug, ratio] of visibility) {
					if (ratio > bestRatio) {
						bestRatio = ratio;
						best = slug;
					}
				}
				if (best && best !== currentSlug) {
					currentSlug = best;
					history.replaceState(null, '', `#${best}`);
				}
			},
			{
				root: scroller,
				threshold: [0.25, 0.5, 0.75, 1],
			},
		);

		sections.forEach((s) => io.observe(s));
		return () => io.disconnect();
	});
</script>
