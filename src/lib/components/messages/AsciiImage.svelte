<script lang="ts">
	import { asciiImage } from './actions/asciiImage.js';

	interface Props {
		srcs: string[];
		class?: string;
		/** Inverted color scheme: light glyphs on dark bg. */
		inverted?: boolean;
	}

	let { srcs, class: className = '', inverted = false }: Props = $props();

	// Fade the canvas in from 0 -> 1 the moment the first frame actually
	// paints. LazyMount can mount this several hundred ms before the image
	// loads; without the fade the section sits blank and then snaps to ASCII.
	let ready = $state(false);
	const onReady = () => {
		ready = true;
	};
</script>

<div class={className}>
	<canvas
		use:asciiImage={{ srcs, inverted, onReady }}
		style="display:block;width:100%;height:100%;opacity:{ready
			? 1
			: 0};transition:opacity 700ms ease-out;"
	></canvas>
</div>
