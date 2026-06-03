<script lang="ts">
	// Homepage gallery deana card: pre-baked ASCII webps via AsciiGallery
	// (cycling <img srcset> with CSS opacity crossfade). Zero per-frame
	// JS work after first paint — was the AsciiMatrixCanvas regression
	// (PR #149 experiment) ticking a 130x90 fillText loop every 3 s
	// forever on the sticky-mounted cards.
	//
	// Lead with deana-hero-5 (the sunset path of Deana walking with the
	// kid) — index 4 in DEANA_ASCII. /deana page DEANA_PHOTOS order is
	// untouched; this rotation is homepage-card only.
	import AsciiGallery from '$lib/components/ascii/AsciiGallery.svelte';
	import { DEANA_ASCII } from '$lib/deana/images.js';

	const HP_ASCII = [
		DEANA_ASCII[4],
		DEANA_ASCII[0],
		DEANA_ASCII[1],
		DEANA_ASCII[2],
		DEANA_ASCII[3],
		DEANA_ASCII[5],
	];
</script>

<AsciiGallery srcs={HP_ASCII} class="absolute inset-0" sizes="(min-width: 1024px) 30vw, 50vw" />
