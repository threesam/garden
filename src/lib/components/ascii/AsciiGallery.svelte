<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { asciiSrcset, type AsciiSrc } from '$lib/deana/images.js';
	import { scheduleIdle, cancelIdle } from '$lib/perf/idle';

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
	// Cycle only starts once every non-lead decode has settled — avoids the
	// "swap to half-loaded blank" jank. Better to hold the first frame a beat
	// longer than flash an empty layer.
	const mounted = new SvelteSet<number>([0]);

	onMount(() => {
		if (srcs.length < 2) return;
		let cancelled = false;
		let timer: ReturnType<typeof setInterval> | null = null;
		let idleHandle: number | null = null;

		const startCycle = () => {
			if (cancelled) return;
			timer = setInterval(() => {
				active = (active + 1) % srcs.length;
				onIndexChange?.(active);
			}, CYCLE_MS);
		};

		// decode() resolves on bitmap-ready, not bytes-on-the-wire. On rejection
		// we leave the index unmounted — a broken-image icon in the cycle is
		// worse than a single blank frame.
		const preload = () => {
			if (cancelled) return;
			Promise.all(
				srcs.slice(1).map((s, i) => {
					const img = new Image();
					img.srcset = asciiSrcset(s);
					img.sizes = sizes;
					img.src = s.lg;
					return img.decode().then(
						() => {
							if (!cancelled) mounted.add(i + 1);
						},
						() => {},
					);
				}),
			).then(startCycle);
		};

		// Wait until first paint is done before kicking off the rest — keeps
		// the critical path clean for the visible card.
		const onReady = () => {
			idleHandle = scheduleIdle(preload);
		};
		if (document.readyState === 'complete') onReady();
		else window.addEventListener('load', onReady, { once: true });

		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
			if (idleHandle !== null) cancelIdle(idleHandle);
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
