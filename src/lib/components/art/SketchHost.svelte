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
		/**
		 * When false, the canvas does not receive pointer events, disabling any
		 * mouse/touch reactivity in the sketch. Defaults to true.
		 */
		interactive?: boolean;
	}

	let { slug, seed, active, interactive = true }: Props = $props();

	const params = $derived({ slug, seed, active, interactive });
</script>

<div class="relative h-full w-full" style="background-color: var(--black);">
	<canvas class="absolute inset-0" use:sketchHost={params}></canvas>
</div>
