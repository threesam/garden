<script lang="ts">
	import { sketchHost } from './actions/sketch-host.js';

	interface Props {
		slug: string;
		seed?: number;
		/**
		 * When true the sketch ticks. When false it tears down — cancels its rAF,
		 * runs cleanup, and clears the canvas pixel buffer.
		 */
		active: boolean;
	}

	let { slug, seed, active }: Props = $props();

	const params = $derived({ slug, seed, active });
</script>

<div class="relative h-full w-full" style="background-color: var(--black);">
	<canvas class="absolute inset-0" use:sketchHost={params}></canvas>
</div>
