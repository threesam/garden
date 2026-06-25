<script lang="ts">
	// Homepage gallery deana card: pre-baked ASCII webps via AsciiGallery
	// (cycling <img srcset> with CSS opacity crossfade). Zero per-frame
	// JS work after first paint.
	//
	// Lead with deana-hero-5 (sunset path with the kid) — index 4 in
	// DEANA_ASCII. This rotation is homepage-card only; /deana hero order
	// lives in that route.
	import AsciiGallery from '$lib/components/ascii/AsciiGallery.svelte';
	import { DEANA_ASCII } from '$lib/deana/images.js';

	const HP_ASCII = [
		DEANA_ASCII[4]!,
		DEANA_ASCII[0]!,
		DEANA_ASCII[1]!,
		DEANA_ASCII[2]!,
		DEANA_ASCII[3]!,
		DEANA_ASCII[5]!,
	];
</script>

<AsciiGallery srcs={HP_ASCII} class="absolute inset-0" sizes="(min-width: 1024px) 30vw, 50vw" />
