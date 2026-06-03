<script lang="ts">
	// Homepage gallery deana card now renders ASCII from a pre-baked char
	// matrix (~24 KB gz total for all 6 photos) instead of shipping the
	// 2 MB of webp pre-bakes. The /deana page is untouched — still uses
	// runtime AsciiImage on the raw photos.
	//
	// Lead with deana-hero-5 (the sunset path of Deana walking with the
	// kid) — index 4 in the bake order. /deana page DEANA_PHOTOS order
	// stays untouched; this rotation is homepage-card only.
	import AsciiMatrixCanvas from './AsciiMatrixCanvas.svelte';
	import { DEANA_MATRICES } from '$lib/deana/ascii-matrices.js';

	const HP_MATRICES = [
		DEANA_MATRICES[4],
		DEANA_MATRICES[0],
		DEANA_MATRICES[1],
		DEANA_MATRICES[2],
		DEANA_MATRICES[3],
		DEANA_MATRICES[5],
	];
</script>

<AsciiMatrixCanvas matrices={HP_MATRICES} class="absolute inset-0" />
