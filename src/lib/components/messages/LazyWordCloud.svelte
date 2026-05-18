<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';

	let WordCloudComponent = $state<Component | null>(null);

	onMount(async () => {
		const mod = await import('./WordCloud.svelte');
		WordCloudComponent = mod.default;
	});
</script>

{#if WordCloudComponent}
	<WordCloudComponent />
{:else}
	<div style="height: 400px;"></div>
{/if}
