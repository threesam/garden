<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { AsciiSrc } from '$lib/deana/images.js';

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
	// Only the first image is mounted up-front; the rest mount one cycle ahead of
	// being shown, so the page fetches one image on load instead of converting six
	// photos to ASCII in JS (which cost ~960ms of main-thread script-eval).
	const mounted = new SvelteSet<number>([0]);

	onMount(() => {
		if (srcs.length < 2) return;
		mounted.add(1);
		const id = setInterval(() => {
			active = (active + 1) % srcs.length;
			onIndexChange?.(active);
			mounted.add((active + 1) % srcs.length);
		}, CYCLE_MS);
		return () => clearInterval(id);
	});

	const srcset = (s: AsciiSrc) => `${s.sm} 380w, ${s.lg} 900w`;
</script>

<div class={className}>
	{#each srcs as s, i (s.lg)}
		{#if mounted.has(i)}
			<img
				class="ascii-gallery-layer"
				src={s.lg}
				srcset={srcset(s)}
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
