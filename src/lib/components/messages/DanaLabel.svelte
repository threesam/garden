<script lang="ts">
	import { onMount } from 'svelte';

	const CHARS = ['I', '_', 'E', '-'];

	let idx = $state(0);

	onMount(() => {
		const id = setInterval(() => {
			idx = (idx + 1) % CHARS.length;
		}, 2000);
		return () => clearInterval(id);
	});
</script>

D<span class="inline-block w-[0.9em] text-center">{CHARS[idx]}</span>ANA
