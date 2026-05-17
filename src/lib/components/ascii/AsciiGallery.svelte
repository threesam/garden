<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { sampleImage, renderAsciiFrame, getGrid } from '$lib/ascii/ascii-utils.js';

	interface Props {
		srcs: string[];
		class?: string;
		cellSize?: number;
		onIndexChange?: (index: number) => void;
		/** Render at 1× CSS pixels instead of devicePixelRatio. */
		lowDpr?: boolean;
	}

	let {
		srcs,
		class: className = '',
		cellSize = 3,
		onIndexChange,
		lowDpr = false
	}: Props = $props();

	const CYCLE_MS = 2000;

	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEls: (HTMLCanvasElement | undefined)[] = $state([]);

	// Module-level scratch canvas reused across all gallery instances.
	let sharedSample: HTMLCanvasElement | null = null;
	function getSampleCanvas() {
		if (!sharedSample) sharedSample = document.createElement('canvas');
		return sharedSample;
	}

	onMount(() => {
		const container = containerEl as HTMLDivElement;
		if (!container) return;

		const baked = new SvelteSet<number>();
		let lastW = 0;
		let lastH = 0;
		let activeIdx = 0;

		const images = srcs.map((src) => {
			const img = new Image();
			img.src = src;
			return img;
		});

		function bake(idx: number) {
			const canvas = canvasEls[idx];
			const img = images[idx];
			if (!canvas || !img.complete || !img.naturalWidth) return;
			const w = container.offsetWidth;
			const h = container.offsetHeight;
			if (w === 0 || h === 0) return;
			const dpr = lowDpr ? 1 : window.devicePixelRatio || 1;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const { cols, rows } = getGrid(w, h, cellSize);
			const pixels = sampleImage(img, cols, rows, w, h, getSampleCanvas());
			if (!pixels) return;
			renderAsciiFrame(canvas.getContext('2d')!, pixels, cols, rows, w, h, dpr);
			baked.add(idx);
			lastW = w;
			lastH = h;
		}

		function show(idx: number) {
			const prev = canvasEls[activeIdx];
			const next = canvasEls[idx];
			if (prev) prev.style.opacity = '0';
			if (next) next.style.opacity = '1';
			activeIdx = idx;
		}

		let timerId: ReturnType<typeof setTimeout> | null = null;
		function scheduleNext() {
			if (srcs.length < 2) return;
			timerId = setTimeout(() => {
				const nextIdx = (activeIdx + 1) % srcs.length;
				if (!baked.has(nextIdx)) bake(nextIdx);
				// Skip rotation if the next image hasn't loaded yet — its onload
				// will bake it and the next cycle will pick it up.
				if (!baked.has(nextIdx)) {
					scheduleNext();
					return;
				}
				onIndexChange?.(nextIdx);
				show(nextIdx);
				scheduleNext();
			}, CYCLE_MS);
		}

		const removeListeners: Array<() => void> = [];
		let started = false;
		function startIfReady() {
			if (started || !images[0].complete || !images[0].naturalWidth) return;
			started = true;
			bake(0);
			show(0);
			scheduleNext();
		}
		startIfReady();
		if (!started) {
			images[0].addEventListener('load', startIfReady);
			removeListeners.push(() => images[0].removeEventListener('load', startIfReady));
		}

		const deferredBakes: ReturnType<typeof setTimeout>[] = [];
		for (let i = 1; i < images.length; i++) {
			const idx = i;
			const onLoad = () => {
				if (!baked.has(idx)) bake(idx);
			};
			if (images[idx].complete && images[idx].naturalWidth) {
				deferredBakes.push(setTimeout(onLoad, 0));
			} else {
				images[idx].addEventListener('load', onLoad);
				removeListeners.push(() => images[idx].removeEventListener('load', onLoad));
			}
		}

		let resizeTimeout: ReturnType<typeof setTimeout>;
		const ro = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				const w = container.offsetWidth;
				const h = container.offsetHeight;
				if (w === lastW && h === lastH) return;
				const previouslyBaked = Array.from(baked);
				baked.clear();
				for (const i of previouslyBaked) bake(i);
			}, 150);
		});
		ro.observe(container);

		return () => {
			if (timerId) clearTimeout(timerId);
			clearTimeout(resizeTimeout);
			for (const t of deferredBakes) clearTimeout(t);
			for (const r of removeListeners) r();
			ro.disconnect();
		};
	});
</script>

<div bind:this={containerEl} class={className}>
	{#each srcs as src, i (src)}
		<canvas
			bind:this={canvasEls[i]}
			class="ascii-gallery-layer"
		></canvas>
	{/each}
</div>
