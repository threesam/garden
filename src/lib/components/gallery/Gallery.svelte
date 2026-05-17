<script lang="ts">
	import { onMount } from 'svelte';
	import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';
	import MetaballCanvas from '$lib/components/canvas/MetaballCanvas.svelte';
	import ParticleTextCanvas from '$lib/components/canvas/ParticleTextCanvas.svelte';
	import EmojiCardBg from '$lib/components/messages/EmojiCardBg.svelte';
	import DanaLabel from '$lib/components/messages/DanaLabel.svelte';
	import SketchHost from '$lib/components/art/SketchHost.svelte';
	import { setCanvasThrottled } from '$lib/perf-flags';

	type ItemHandle =
		| 'self'
		| 'deana'
		| 'shelf'
		| 'anything-but-analog'
		| 'thoughts'
		| 'sounds';

	const UNIQUE_ITEMS: { label: string; handle: ItemHandle; href: string }[] = [
		{ label: 'self', handle: 'self', href: '/canvas/self' },
		{ label: 'D-ANA', handle: 'deana', href: '/deana' },
		{ label: 'shelf', handle: 'shelf', href: '/shelf' },
		{ label: 'analog', handle: 'anything-but-analog', href: '/anything-but-analog' },
		{ label: 'thoughts', handle: 'thoughts', href: '/thoughts' },
		{ label: 'sounds', handle: 'sounds', href: '/sounds' },
	];

	const UNIQUE_COUNT = UNIQUE_ITEMS.length;
	const LOOPED = [...UNIQUE_ITEMS, ...UNIQUE_ITEMS].map((it, i) => ({ id: i, ...it }));

	const CARD_GAP = 24;
	const SPEED = 30;
	const LOOKAHEAD = 1;

	const BG_MAP: Partial<Record<ItemHandle, string>> = {
		deana: 'var(--white)',
	};

	let stripEl: HTMLDivElement | undefined = $state();
	// Virtualization window: only cards in [lo, hi] mount their heavy canvas.
	let activeRange = $state<[number, number]>([0, 0]);

	// Track active state for SketchHost cards.
	function isActive(i: number): boolean {
		return i >= activeRange[0] && i <= activeRange[1];
	}

	onMount(() => {
		if (!stripEl) return;
		const section = stripEl.parentElement!;

		let offsetRef = 0;
		let speedRef = SPEED;
		let targetSpeedRef = SPEED;
		let rafRef = 0;
		let lastRef = performance.now();
		let activeRangeRef: [number, number] = [0, 0];
		let stripW = 1;
		let measured = false;
		let didDrag = false;

		const drag = {
			active: false,
			startX: 0,
			startOffset: 0,
			lastX: 0,
			lastTime: 0,
			velocity: 0,
		};

		function measure() {
			const firstCard = stripEl!.firstElementChild as HTMLElement | null;
			if (firstCard && firstCard.offsetWidth > 0) {
				stripW = UNIQUE_COUNT * (firstCard.offsetWidth + CARD_GAP);
				measured = true;
			}
		}

		function wake() {
			if (!rafRef) {
				lastRef = performance.now();
				rafRef = requestAnimationFrame(tick);
			}
		}

		function tick(now: number) {
			const dt = Math.min((now - lastRef) / 1000, 0.1);
			lastRef = now;
			if (stripW < 2) measure();

			const lerpRate = targetSpeedRef === 0 ? 0.1 : 0.02;
			speedRef += (targetSpeedRef - speedRef) * lerpRate;
			if (Math.abs(speedRef) < 0.1) speedRef = 0;

			if (!drag.active) {
				if (Math.abs(drag.velocity) > 0.5) {
					offsetRef += drag.velocity * dt;
					drag.velocity *= 0.95;
				} else {
					drag.velocity = 0;
					offsetRef += speedRef * dt;
				}
			}

			offsetRef = ((offsetRef % stripW) + stripW) % stripW;
			stripEl!.style.transform = `translate3d(${-offsetRef}px,0,0)`;

			const isMoving =
				Math.abs(speedRef) > 0.5 ||
				Math.abs(drag.velocity) > 0.5 ||
				drag.active;
			setCanvasThrottled(isMoving);

			const stride = stripW / UNIQUE_COUNT;
			if (measured && stride > 0) {
				const sectionW = section.clientWidth;
				const first = Math.floor(offsetRef / stride) - LOOKAHEAD;
				const last = Math.ceil((offsetRef + sectionW) / stride) + LOOKAHEAD - 1;
				const lo = Math.max(0, first);
				let hi = Math.min(LOOPED.length - 1, last);
				const cur = activeRangeRef;
				if (hi > cur[1] + 1) hi = cur[1] + 1;
				if (cur[0] !== lo || cur[1] !== hi) {
					activeRangeRef = [lo, hi];
					activeRange = [lo, hi];
				}
			}

			const isIdle =
				targetSpeedRef === 0 &&
				speedRef === 0 &&
				Math.abs(drag.velocity) < 0.5 &&
				!drag.active;
			if (isIdle) {
				rafRef = 0;
				setCanvasThrottled(false);
				return;
			}
			rafRef = requestAnimationFrame(tick);
		}

		rafRef = requestAnimationFrame(tick);

		const ro = new ResizeObserver(() => {
			measure();
			wake();
		});
		ro.observe(section);

		function onEnter() {
			targetSpeedRef = 0;
		}
		function onLeave() {
			targetSpeedRef = SPEED;
			wake();
		}

		function onDown(e: PointerEvent) {
			didDrag = false;
			drag.active = true;
			drag.startX = e.clientX;
			drag.startOffset = offsetRef;
			drag.lastX = e.clientX;
			drag.lastTime = performance.now();
			drag.velocity = 0;
			wake();
		}

		function onMove(e: PointerEvent) {
			if (!drag.active) return;
			if (Math.abs(e.clientX - drag.startX) > 5) didDrag = true;
			offsetRef = drag.startOffset - (e.clientX - drag.startX);
			const now = performance.now();
			const vDt = (now - drag.lastTime) / 1000;
			if (vDt > 0) drag.velocity = -(e.clientX - drag.lastX) / vDt;
			drag.lastX = e.clientX;
			drag.lastTime = now;
		}

		function onUp() {
			drag.active = false;
		}

		function onWheel(e: WheelEvent) {
			if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
				e.preventDefault();
				drag.velocity = 0;
				offsetRef += e.deltaX;
				wake();
			}
		}

		section.addEventListener('mouseenter', onEnter);
		section.addEventListener('mouseleave', onLeave);
		section.addEventListener('pointerdown', onDown);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		section.addEventListener('wheel', onWheel, { passive: false });

		return () => {
			cancelAnimationFrame(rafRef);
			ro.disconnect();
			section.removeEventListener('mouseenter', onEnter);
			section.removeEventListener('mouseleave', onLeave);
			section.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			section.removeEventListener('wheel', onWheel);
			setCanvasThrottled(false);
		};
	});

	function handleClick(e: MouseEvent, item: { href: string; handle: string }) {
		if ((e.currentTarget as HTMLElement).dataset.didDrag === 'true') {
			e.preventDefault();
			return;
		}
		e.preventDefault();
		window.umami?.track('gallery-card-click', { handle: item.handle });
		window.location.href = item.href;
	}

	function onCardMouseEnter(e: MouseEvent) {
		const card = e.currentTarget as HTMLElement;
		card.style.borderColor = 'var(--coin)';
		card.style.transform = 'rotate(-1.3deg)';
		const label = card.querySelector('[data-card-label]') as HTMLElement | null;
		if (label) label.style.color = 'var(--coin)';
	}

	function onCardMouseLeave(e: MouseEvent) {
		const card = e.currentTarget as HTMLElement;
		card.style.borderColor = 'var(--black)';
		card.style.transform = 'rotate(0deg)';
		const label = card.querySelector('[data-card-label]') as HTMLElement | null;
		if (label) label.style.color = 'var(--white)';
	}
</script>

<section
	class="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
	style="touch-action: none; padding: {CARD_GAP}px;"
>
	<div
		bind:this={stripEl}
		class="flex h-full"
		style="gap: {CARD_GAP}px; will-change: transform;"
	>
		{#each LOOPED as item, i (item.id + '-' + i)}
			{@const visible = isActive(i)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<a
				href={item.href}
				draggable="false"
				onclick={(e) => handleClick(e, item)}
				onmouseenter={onCardMouseEnter}
				onmouseleave={onCardMouseLeave}
				class="group relative h-full shrink-0 overflow-hidden rounded-2xl transition-all duration-700"
				style="aspect-ratio: 4 / 5; background-color: {BG_MAP[item.handle as ItemHandle] ?? 'var(--black)'}; border: 3px solid var(--black); display: block;"
			>
				{#if visible}
					<div class="absolute inset-0">
						{#if item.handle === 'self'}
							<VoronoiCanvas
								invert
								showLetters={false}
								imageSrc="/assets/self-hero-mobile.webp"
								scale={20}
								fit="cover"
							/>
						{:else if item.handle === 'deana'}
							<EmojiCardBg />
						{:else if item.handle === 'shelf'}
							<MetaballCanvas color={[0.91, 0.64, 0.09]} />
						{:else if item.handle === 'anything-but-analog'}
							<ParticleTextCanvas countOverride={4000} hideText pointSize={2} repelRadius={50} lowDpr />
						{:else if item.handle === 'thoughts'}
							<SketchHost slug="30" active />
						{:else if item.handle === 'sounds'}
							<SketchHost slug="25" active />
						{/if}
					</div>
				{/if}
				<span
					data-card-label
					class="absolute bottom-6 left-6 z-10 rounded-2xl p-3 font-mono text-xl font-bold uppercase tracking-[0.3em] transition-colors duration-300 lg:text-2xl"
					style="background-color: var(--black); color: var(--white);"
				>
					{#if item.handle === 'deana'}
						<DanaLabel />
					{:else}
						{item.label}
					{/if}
				</span>
			</a>
		{/each}
	</div>
</section>
