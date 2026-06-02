<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import SketchHost from './SketchHost.svelte';

	export interface SketchMeta {
		slug: string;
		date: string;
		description?: string;
	}

	interface Props {
		sketches: SketchMeta[];
		/** Number of hero/non-sketch sections before this list. */
		heroCount?: number;
		/** How many sketches to keep active ahead of current. 0 = only the
		 * in-view sketch ticks (others tear down — keeps heavy sketches from
		 * running simultaneously). */
		lookahead?: number;
		/** How many previous sketches to keep (handles scroll-up). */
		lookback?: number;
	}

	let {
		sketches,
		heroCount = 1,
		lookahead = 0,
		lookback = 0,
	}: Props = $props();

	let activeIdx = $state(0);

	onMount(() => {
		const el = document.getElementById('art-scroller') as HTMLElement | null;
		if (!el) return;

		let rafId = 0;

		function update() {
			rafId = 0;
			if (!el) return;
			const h = el.clientHeight;
			if (h === 0) return;
			const rawIdx = Math.round(el.scrollTop / h);
			const gallery = rawIdx - heroCount;
			const sketchIdx = gallery < 0 ? -100 : Math.min(sketches.length - 1, gallery);
			if (sketchIdx !== activeIdx) activeIdx = sketchIdx;
		}

		function onScroll() {
			if (!rafId) rafId = requestAnimationFrame(update);
		}

		el.addEventListener('scroll', onScroll, { passive: true });
		update();

		return () => {
			el.removeEventListener('scroll', onScroll);
			if (rafId) cancelAnimationFrame(rafId);
		};
	});
</script>

{#each sketches as s, i (s.slug)}
	{@const active = i >= activeIdx - lookback && i <= activeIdx + lookahead}
	<section
		id={s.slug}
		data-art-slug={s.slug}
		class="relative h-dvh w-full snap-start overflow-hidden"
		style="content-visibility: auto; contain-intrinsic-size: 100dvh;"
	>
		<SketchHost slug={s.slug} {active} bgClass="bg-black" />
		<!-- True-black overlay over each sketch: fades both ways (transition:fade)
		     so scrolling back and forth smoothly reveals / hides the sketch. -->
		{#if !active}
			<div
				class="pointer-events-none absolute inset-0 z-[5] bg-black"
				transition:fade={{ duration: 1000 }}
			></div>
		{/if}
		<span
			class="pointer-events-none absolute top-5 left-5 z-10 grid place-items-center font-mono text-xs font-bold uppercase tracking-[0.12em] md:top-6 md:left-8"
			style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--black); color: var(--white); box-shadow: inset 0 0 0 1.5px var(--white), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);"
		>
			{s.slug}
		</span>
		<span
			class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-xs uppercase tracking-[0.25em] text-white md:bottom-10 md:left-10 md:text-sm"
			style="mix-blend-mode: difference;"
		>
			{s.date}
		</span>
		{#if s.description}
			<span
				class="pointer-events-none absolute right-6 bottom-6 z-10 max-w-[60%] text-right font-mono text-xs uppercase tracking-hero text-white md:right-10 md:bottom-10 md:max-w-[40%] md:text-sm"
			>
				{s.description}
			</span>
		{/if}
	</section>
{/each}
