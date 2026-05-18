<script lang="ts">
	import { onMount } from 'svelte';
	import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';

	interface Props {
		href?: string;
	}

	let { href }: Props = $props();

	const IMG_SRC = '/assets/anything-but-analog.webp';
	const INITIAL_ASPECT = 1052 / 1156;

	let aspect = $state(INITIAL_ASPECT);

	onMount(() => {
		const img = new Image();
		img.onload = () => { aspect = img.width / img.height; };
		img.src = IMG_SRC;
	});
</script>

{#snippet body()}
	<div
		class="voronoi-banner"
		style="--banner-aspect: {aspect};"
	>
		<div class="voronoi-banner-inner">
			<VoronoiCanvas imageSrc={IMG_SRC} invert showLetters={false} />
			<span
				class="pointer-events-none absolute right-6 bottom-6 z-10 font-mono text-2xl font-bold uppercase tracking-[0.1em] md:right-20 md:bottom-20 md:text-5xl"
				style="color: var(--white);"
			>
				anything but analog
			</span>
		</div>
	</div>
{/snippet}

{#if href}
	<a href={href} class="block">
		{@render body()}
	</a>
{:else}
	{@render body()}
{/if}
