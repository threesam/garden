<script lang="ts">
	import { asciiImage } from './actions/asciiImage.js';

	interface Props {
		srcs: string[];
		class?: string;
		/** Inverted color scheme: light glyphs on dark bg. */
		inverted?: boolean;
	}

	let { srcs, class: className = '', inverted = false }: Props = $props();
</script>

<div class={className}>
	<canvas use:asciiImage={{ srcs, inverted }} style="display:block;width:100%;height:100%;"></canvas>
</div>
