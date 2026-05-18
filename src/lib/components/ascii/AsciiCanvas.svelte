<script lang="ts">
	import { asciiCanvas } from '$lib/actions/ascii-canvas.js';

	interface Props {
		src: string;
		class?: string;
		cellSize?: number;
	}

	let { src, class: className = '', cellSize = 3 }: Props = $props();
</script>

<div class={className}>
	<canvas use:asciiCanvas={{ src, cellSize }}></canvas>
</div>
