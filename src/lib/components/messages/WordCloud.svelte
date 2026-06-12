<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import cloud from 'd3-cloud';
	import { mulberry32 } from '$lib/art/rng';
	import wordsData from '../../../../data/messages/dianchik/words-data.json';

	interface WordEntry {
		word: string;
		count: number;
	}

	type Who = 'both' | 'sam' | 'dianchik';

	const sam = wordsData.sam_cloud as WordEntry[];
	const dia = wordsData.dia_cloud as WordEntry[];

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- computed once at init; never read by the template
	const merged = new Map<string, number>();
	for (const e of sam) merged.set(e.word, (merged.get(e.word) ?? 0) + e.count);
	for (const e of dia) merged.set(e.word, (merged.get(e.word) ?? 0) + e.count);
	const both = [...merged.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 300)
		.map(([word, count]) => ({ word, count }));

	interface LayoutWord {
		text: string;
		size: number;
		x: number;
		y: number;
		rotate: number;
		count: number;
	}

	let who = $state<Who>('both');
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();

	const layoutCache = new SvelteMap<string, LayoutWord[]>();

	function paint(layoutWords: LayoutWord[], baseColor: number[], max: number) {
		const canvas = canvasEl;
		if (!canvas) return;
		const ctx = canvas.getContext('2d')!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (const w of layoutWords) {
			const opacity = 0.2 + (w.count / max) * 0.8;
			ctx.save();
			ctx.translate(canvas.width / 2 + w.x, canvas.height / 2 + w.y);
			ctx.rotate((w.rotate * Math.PI) / 180);
			ctx.font = `${w.size}px Jost, sans-serif`;
			ctx.fillStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${opacity})`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(w.text, 0, 0);
			ctx.restore();
		}
	}

	function draw() {
		const canvas = canvasEl;
		const container = containerEl;
		if (!canvas || !container) return;

		const width = container.clientWidth;
		const height = 400;
		canvas.width = width * 2;
		canvas.height = height * 2;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		const wordsByWho: Record<Who, typeof sam> = { sam, dianchik: dia, both };
		const words = wordsByWho[who];
		const max = words[0]?.count ?? 1;

		const colorByWho: Record<Who, [number, number, number]> = {
			sam: [30, 30, 30],
			dianchik: [180, 140, 20],
			both: [60, 60, 60],
		};
		const baseColor = colorByWho[who];

		const cacheKey = `${who}:${width}`;
		const cached = layoutCache.get(cacheKey);
		if (cached) {
			paint(cached, baseColor, max);
			return;
		}

		const rng = mulberry32(42);
		const layout = cloud()
			.size([width * 2, height * 2])
			.words(
				words.map((w) => ({
					text: w.word,
					size: 14 + Math.pow(w.count / max, 0.6) * 120,
					count: w.count,
				}))
			)
			.padding(1)
			.rotate(() => (rng() > 0.7 ? 90 : 0))
			.random(rng)
			.font('Jost, sans-serif')
			.fontSize((d) => (d as { size: number }).size)
			.on('end', (layoutWords: LayoutWord[]) => {
				layoutCache.set(cacheKey, layoutWords);
				paint(layoutWords, baseColor, max);
			});

		layout.start();
	}

	let clearAndDraw: (() => void) | undefined;

	$effect(() => {
		// Re-run whenever `who` changes; no-op until clearAndDraw is set by onMount.
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		who;
		clearAndDraw?.();
	});

	onMount(() => {
		clearAndDraw = () => {
			layoutCache.clear();
			draw();
		};

		draw();

		let timeout: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(timeout);
			layoutCache.clear();
			timeout = setTimeout(draw, 150);
		};
		window.addEventListener('resize', onResize);

		return () => {
			clearTimeout(timeout);
			window.removeEventListener('resize', onResize);
			clearAndDraw = undefined;
		};
	});
</script>

<div>
	<div class="mb-3 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-label text-zinc-600">word cloud</span>
		<div class="flex gap-3">
			{#each ['both', 'dianchik', 'sam'] as w (w)}
				<button
					onclick={() => (who = w as Who)}
					class="font-mono text-[10px] tracking-wider transition-colors {who === w
						? 'text-black'
						: 'text-zinc-600 hover:text-black'}"
				>
					{w}
				</button>
			{/each}
		</div>
	</div>
	<div bind:this={containerEl} class="w-full">
		<canvas bind:this={canvasEl}></canvas>
	</div>
</div>
