<script lang="ts">
	import DanaLabel from './DanaLabel.svelte';
	import LazyMount from '$lib/components/LazyMount.svelte';
	import { asciiSrcset, type AsciiSrc } from '$lib/deana/images.js';

	interface Props {
		src: AsciiSrc;
	}

	let { src }: Props = $props();
</script>

<section
	class="relative h-dvh w-full overflow-hidden"
	style="background-color: var(--white); content-visibility: auto; contain-intrinsic-size: 100vw 100dvh;"
>
	<LazyMount class="absolute inset-0">
		<img
			src={src.lg}
			srcset={asciiSrcset(src)}
			sizes="100vw"
			alt=""
			class="h-full w-full object-cover"
			loading="lazy"
		/>
	</LazyMount>
	<span
		class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-2xl font-bold uppercase tracking-[0.3em] md:bottom-10 md:left-10 md:text-5xl"
		style="color: var(--black); text-shadow: 0 0 2px rgba(245,244,240,0.95), 0 1px 6px rgba(245,244,240,0.7);"
	>
		<DanaLabel />
	</span>
</section>
