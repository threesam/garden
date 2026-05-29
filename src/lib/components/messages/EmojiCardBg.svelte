<script lang="ts">
	import AsciiGallery from '$lib/components/ascii/AsciiGallery.svelte';
	import { DEANA_ASCII } from '$lib/deana/images.js';
</script>

<AsciiGallery srcs={DEANA_ASCII} class="absolute inset-0" sizes="(min-width: 1024px) 30vw, 50vw" />
