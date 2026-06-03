<script lang="ts">
	import AsciiImage from './AsciiImage.svelte';
	import DanaLabel from './DanaLabel.svelte';
	import LazyMount from '$lib/components/LazyMount.svelte';

	interface Props {
		src: string;
		/** Optional secondary src for crossfade cycling. */
		altSrcs?: string[];
	}

	let { src, altSrcs }: Props = $props();

	const srcs = $derived(altSrcs?.length ? [src, ...altSrcs] : [src]);
</script>

<section
	class="relative h-dvh w-full overflow-hidden bg-white"
	style="content-visibility: auto; contain-intrinsic-size: 100vw 100dvh;"
>
	<!-- rootMargin tightened 400 -> 200 and mount deferred to idle so the
	     ascii canvas setup + first-frame paint don't compete with scroll.
	     content-visibility: auto on the parent already keeps off-screen
	     sections cheap; this keeps the on-mount work calm. -->
	<LazyMount class="absolute inset-0" rootMargin="200px" useIdle>
		<AsciiImage {srcs} class="h-full w-full" />
	</LazyMount>
	<span
		class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-2xl font-bold uppercase tracking-pill text-black md:bottom-10 md:left-10 md:text-5xl"
		style="text-shadow: 0 0 2px rgba(245,244,240,0.95), 0 1px 6px rgba(245,244,240,0.7);"
	>
		<DanaLabel />
	</span>
</section>
