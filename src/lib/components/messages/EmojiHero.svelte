<script lang="ts">
	import AsciiGallery from '$lib/components/ascii/AsciiGallery.svelte';
	import { DEANA_ASCII } from '$lib/deana/images.js';

	const CHARS = ['I', '_', 'E', '-'];

	let charIdx = $state(0);
</script>

<div
	class="relative mb-3 h-[50dvh] w-full overflow-hidden"
	style="background-color: var(--white);"
>
	<AsciiGallery
		srcs={DEANA_ASCII}
		class="absolute inset-0"
		sizes="100vw"
		onIndexChange={(idx) => (charIdx = idx % CHARS.length)}
	/>
	<div class="pointer-events-none absolute inset-0 flex items-end justify-start p-6 md:p-18">
		<h1 class="font-mono text-2xl font-bold uppercase tracking-[0.1em] text-[var(--black)] md:text-5xl">
			D<span class="inline-block w-6 text-center md:w-9">{CHARS[charIdx]}</span>ANA
		</h1>
	</div>
</div>
