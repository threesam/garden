<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { asciiSrcset, type AsciiSrc } from '$lib/deana/images.js';

	interface Props {
		srcs: AsciiSrc[];
		class?: string;
		/** <img sizes> hint — small for the card, full-width for /deana. */
		sizes?: string;
		onIndexChange?: (index: number) => void;
	}

	let { srcs, class: className = '', sizes = '100vw', onIndexChange }: Props = $props();

	const CYCLE_MS = 2000;

	let active = $state(0);
	// Two-phase load: the first image mounts immediately (so the card paints
	// asap, eager + high priority). The rest are preloaded in parallel via
	// new Image() on idle after first paint, mount as they each finish, and
	// only once ALL are decoded do we start the crossfade cycle. Avoids the
	// "image swap to half-loaded blank" jank the user flagged — better to
	// hold on the first frame a beat longer than to flash an empty layer.
	const mounted = new SvelteSet<number>([0]);

	onMount(() => {
		if (srcs.length < 2) return;
		let cancelled = false;
		let timer: ReturnType<typeof setInterval> | null = null;
		const startCycle = () => {
			if (cancelled) return;
			timer = setInterval(() => {
				active = (active + 1) % srcs.length;
				onIndexChange?.(active);
			}, CYCLE_MS);
		};
		// Preload imgs 1..N on idle. decode() resolves once the bitmap is ready
		// to paint — a real "loaded" signal, not just bytes-on-the-wire.
		const preload = () => {
			if (cancelled) return;
			const rest = srcs.slice(1);
			Promise.all(
				rest.map((s, i) => {
					const img = new Image();
					img.srcset = asciiSrcset(s);
					img.sizes = sizes;
					img.src = s.lg;
					return img.decode().then(
						() => {
							if (cancelled) return;
							mounted.add(i + 1);
						},
						() => {
							if (cancelled) return;
							mounted.add(i + 1);
						},
					);
				}),
			).then(startCycle);
		};
		// Wait for the first image to be decoded before kicking off the rest —
		// keeps the critical path clean for the visible card.
		const onReady = () =>
			('requestIdleCallback' in window
				? requestIdleCallback(preload, { timeout: 2000 })
				: setTimeout(preload, 0)) as unknown;
		// If the first img is already cached (HMR / back nav), kick off immediately.
		if (document.readyState === 'complete') onReady();
		else window.addEventListener('load', onReady, { once: true });
		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
			window.removeEventListener('load', onReady);
		};
	});
</script>

<div class={className}>
	{#each srcs as s, i (s.lg)}
		{#if mounted.has(i)}
			<img
				class="ascii-gallery-layer"
				src={s.lg}
				srcset={asciiSrcset(s)}
				{sizes}
				alt=""
				loading={i === 0 ? 'eager' : 'lazy'}
				fetchpriority={i === 0 ? 'high' : 'auto'}
				style="opacity: {i === active ? 1 : 0};"
			/>
		{/if}
	{/each}
</div>

<style>
	.ascii-gallery-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.6s ease;
	}
</style>
