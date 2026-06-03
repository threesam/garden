<script lang="ts">
	// Homepage gallery deana card now renders ASCII from a pre-baked char
	// matrix (~9 KB gz total for all 6 photos) instead of shipping the
	// 2 MB of webp pre-bakes. The /deana page is untouched — still uses
	// runtime AsciiImage on the raw photos.
	import AsciiMatrixCanvas from './AsciiMatrixCanvas.svelte';
	import { DEANA_MATRICES } from '$lib/deana/ascii-matrices.js';
</script>

<AsciiMatrixCanvas matrices={DEANA_MATRICES} class="absolute inset-0" />
