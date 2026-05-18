<script lang="ts">
	import AsciiGallery from '$lib/components/ascii/AsciiGallery.svelte';
	import { DEANA_IMAGES } from '$lib/deana/images.js';
</script>

<AsciiGallery srcs={DEANA_IMAGES} class="absolute inset-0" lowDpr />
