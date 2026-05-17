<script lang="ts">
	import { onMount } from 'svelte';
	import MetaballCanvas from '$lib/components/canvas/MetaballCanvas.svelte';
	import { extractDominantColor } from '$lib/dominant-color';
	import type { Book } from '$lib/goodreads';

	// --black #1a1a14 as normalized RGB
	const BG_COLOR: [number, number, number] = [26 / 255, 26 / 255, 20 / 255];

	interface Props {
		featured: Book | null;
		featuredLabel: string;
	}

	let { featured, featuredLabel }: Props = $props();

	let coverEl: HTMLImageElement | undefined = $state();
	let descEl: HTMLParagraphElement | undefined = $state();
	let target = $state<{ x: number; y: number } | null>(null);
	let color = $state<[number, number, number]>(BG_COLOR);
	let expanded = $state(false);
	let contentHeight = $state(0);
	let metaballsHidden = $state(true);

	function toggleExpanded() {
		if (descEl) contentHeight = descEl.scrollHeight;
		metaballsHidden = true;
		setTimeout(() => { metaballsHidden = false; }, 1000);
		expanded = !expanded;
	}

	onMount(() => {
		if (!featured?.coverUrl) {
			metaballsHidden = false;
			return;
		}
		let cancelled = false;
		extractDominantColor(featured.coverUrl).then((c) => {
			if (cancelled) return;
			if (c) color = c;
			metaballsHidden = false;
		});
		return () => { cancelled = true; };
	});

	function updateTarget() {
		const rect = coverEl?.getBoundingClientRect();
		if (!rect) return;
		target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	}

	function clearTarget() {
		target = null;
	}

	const patternUrl = $derived.by(() => {
		const cssColor = `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`;
		const tileW = 900;
		const tileH = 460;
		const phrase = "WHAT'S ON MY SHELF? ".repeat(10);
		const rows = [
			{ y: 38, size: 26, offset: 0 },
			{ y: 92, size: 16, offset: -140 },
			{ y: 148, size: 34, offset: 70 },
			{ y: 200, size: 20, offset: -60 },
			{ y: 258, size: 44, offset: 110 },
			{ y: 316, size: 18, offset: -90 },
			{ y: 366, size: 28, offset: 30 },
			{ y: 420, size: 14, offset: -50 },
		];
		const rowsSvg = rows
			.map(
				(r) =>
					`<text x='${r.offset}' y='${r.y}' font-family='monospace' font-size='${r.size}' font-weight='700' letter-spacing='${Math.round(r.size * 0.3)}' fill='${cssColor}'>${phrase}</text>`,
			)
			.join('');
		const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}' viewBox='0 0 ${tileW} ${tileH}'>${rowsSvg}</svg>`;
		return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
	});

	const shadowRgb = $derived(
		`${Math.round(color[0] * 255)} ${Math.round(color[1] * 255)} ${Math.round(color[2] * 255)}`,
	);
</script>

<section
	class="relative flex min-h-dvh items-start justify-center overflow-hidden px-6 pt-24 pb-18 md:items-center md:px-9 md:py-18"
	style="background: var(--black);"
>
	<div
		class="pointer-events-none absolute inset-0"
		style="z-index: 0; background-image: {patternUrl}; background-repeat: repeat; opacity: 0.13;"
		aria-hidden="true"
	></div>

	<div
		class="pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out"
		style="z-index: 2; opacity: {metaballsHidden ? 0 : 1};"
	>
		<MetaballCanvas {color} trackCursor={false} {target} />
	</div>

	<h1 class="sr-only">what's on my shelf?</h1>

	{#if featured}
		<div class="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12">
			<a
				href={`https://www.goodreads.com/book/show/${featured.id}`}
				target="_blank"
				rel="noopener noreferrer"
				class="group/cover flex items-center justify-center md:justify-end"
				onmouseenter={updateTarget}
				onmouseleave={clearTarget}
			>
				{#if featured.coverUrl}
					<img
						bind:this={coverEl}
						src={featured.coverUrl}
						alt={featured.cleanTitle}
						width="400"
						height="600"
						style="--shadow-rgb: {shadowRgb};"
						class="block w-full max-w-[18rem] shadow-[0_20px_50px_-15px_rgb(var(--shadow-rgb)/0.45)] transition duration-700 group-hover/cover:-translate-y-1 group-hover/cover:-rotate-[1.3deg] group-hover/cover:shadow-[0_50px_120px_-20px_rgb(var(--shadow-rgb)/0.8)] md:max-h-[60dvh] md:w-[clamp(18rem,32vw,26rem)] md:max-w-none"
					/>
				{/if}
			</a>

			<div class="flex flex-col gap-3 md:max-w-md" style="color: var(--white);">
				<a
					href={`https://www.goodreads.com/book/show/${featured.id}`}
					target="_blank"
					rel="noopener noreferrer"
					class="flex flex-col gap-3"
				>
					<div class="font-mono text-xs uppercase tracking-[0.3em]" style="color: var(--coin);">
						{featuredLabel}
					</div>
					<h2 class="text-3xl font-bold leading-tight md:text-4xl">{featured.cleanTitle}</h2>
					<div class="text-base opacity-70">
						{featured.author}{#if featured.series}
							{' · '}
							{featured.series} #{featured.seriesNumber}
						{/if}
					</div>
				</a>

				{#if featured.description}
					<div>
						<p
							bind:this={descEl}
							style={expanded && contentHeight > 0 ? `max-height: ${contentHeight}px;` : undefined}
							class={[
								'overflow-hidden whitespace-pre-line text-sm leading-relaxed opacity-75 transition-[max-height] duration-500 ease-out md:!max-h-none md:text-base',
								expanded ? '' : 'max-md:max-h-18',
							].join(' ')}
						>
							{featured.description}
						</p>
						<button
							type="button"
							onclick={toggleExpanded}
							class="mt-1.5 font-mono text-xs uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-80 md:hidden"
							style="color: var(--coin);"
						>
							{expanded ? 'show less' : 'read more'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
