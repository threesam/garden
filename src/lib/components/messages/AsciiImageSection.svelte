<script lang="ts">
	import DanaLabel from './DanaLabel.svelte';
	import { asciiSrcset, type AsciiSrc } from '$lib/deana/images';

	interface Props {
		/** Pre-baked ASCII print {sm, lg} (per scripts/generate-deana-ascii.mjs). */
		ascii: AsciiSrc;
		/** First-section hero stays eager so it lands as the LCP. Others lazy. */
		eager?: boolean;
	}

	let { ascii, eager = false }: Props = $props();

	// Lazy sections gate visual reveal on the img's load event so a scrolled-to
	// section never flashes a half-decoded frame. The eager hero skips the gate
	// — hiding the LCP candidate behind a 700 ms fade would tank the score.
	let loaded = $state(eager);
</script>

<section
	class="relative h-dvh w-full overflow-hidden bg-white"
	style="content-visibility: auto; contain-intrinsic-size: 100vw 100dvh;"
>
	<img
		src={ascii.lg}
		srcset={asciiSrcset(ascii)}
		sizes="100vw"
		alt=""
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={eager ? 'high' : 'auto'}
		decoding="async"
		onload={() => (loaded = true)}
		class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
		style:opacity={loaded ? 1 : 0}
	/>
	<span
		class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-2xl font-bold uppercase tracking-pill text-black md:bottom-10 md:left-10 md:text-5xl"
		style="text-shadow: 0 0 2px rgba(245,244,240,0.95), 0 1px 6px rgba(245,244,240,0.7);"
	>
		<DanaLabel />
	</span>
</section>
