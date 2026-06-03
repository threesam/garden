<script lang="ts">
	import { asciiMatrix } from './actions/asciiMatrix.js';
	import type { AsciiMatrix } from '$lib/deana/ascii-matrices.js';

	interface Props {
		matrices: AsciiMatrix[];
		class?: string;
	}

	let { matrices, class: className = '' }: Props = $props();

	// Fade canvas in on first paint — same UX as AsciiImage.svelte. Without
	// this, LazyMount drops in an opaque blank canvas before any glyphs land.
	let ready = $state(false);
	const onReady = () => {
		ready = true;
	};
</script>

<div class={className}>
	<canvas
		use:asciiMatrix={{ matrices, onReady }}
		style="display:block;width:100%;height:100%;opacity:{ready
			? 1
			: 0};transition:opacity 700ms ease-out;"
	></canvas>
</div>
