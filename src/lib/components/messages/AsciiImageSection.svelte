<script lang="ts">
	import AsciiImage from './AsciiImage.svelte';
	import DanaLabel from './DanaLabel.svelte';
	import LazyMount from '$lib/components/LazyMount.svelte';

	interface Props {
		src: string;
		/** Optional secondary src for crossfade cycling. */
		altSrcs?: string[];
		/** Defer mount to requestIdleCallback so the canvas first-frame
		 *  paint lands in an idle slot rather than competing with scroll.
		 *  Leave OFF (default) for the first/above-the-fold section — the
		 *  rIC delay pushes LCP back. Turn ON for off-screen sections. */
		useIdle?: boolean;
	}

	let { src, altSrcs, useIdle = false }: Props = $props();

	const srcs = $derived(altSrcs?.length ? [src, ...altSrcs] : [src]);
</script>

<section
	class="relative h-dvh w-full overflow-hidden bg-white"
	style="content-visibility: auto; contain-intrinsic-size: 100vw 100dvh;"
>
	<!-- rootMargin tightened 400 -> 200 in either case. useIdle only when
	     the section isn't the hero — for above-the-fold the rIC wait
	     would push LCP back instead of saving TBT. -->
	<LazyMount class="absolute inset-0" rootMargin="200px" {useIdle}>
		<AsciiImage {srcs} class="h-full w-full" />
	</LazyMount>
	<span
		class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-2xl font-bold uppercase tracking-pill text-black md:bottom-10 md:left-10 md:text-5xl"
		style="text-shadow: 0 0 2px rgba(245,244,240,0.95), 0 1px 6px rgba(245,244,240,0.7);"
	>
		<DanaLabel />
	</span>
</section>
