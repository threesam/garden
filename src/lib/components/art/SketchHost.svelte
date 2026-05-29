<script lang="ts">
	import { sketchHost } from './actions/sketch-host.js';

	interface Props {
		slug: string;
		seed?: number;
		/**
		 * When true the sketch ticks. When false it stops ticking (frees the CPU)
		 * but keeps the last frame painted so it can be faded out.
		 */
		active: boolean;
		/**
		 * When false, the canvas does not receive pointer events, disabling any
		 * mouse/touch reactivity in the sketch. Defaults to true.
		 */
		interactive?: boolean;
		/** Tailwind class for the canvas backdrop. Defaults to bg-[var(--black)]. */
		bgClass?: string;
	}

	let { slug, seed, active, interactive = true, bgClass = 'bg-[var(--black)]' }: Props = $props();

	const params = $derived({ slug, seed, active, interactive });
</script>

<div class="relative h-full w-full {bgClass}">
	<canvas class="absolute inset-0" use:sketchHost={params}></canvas>
</div>
