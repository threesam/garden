<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import DanaLabel from '$lib/components/messages/DanaLabel.svelte';
	import { setCanvasThrottled } from '$lib/perf-flags';

	type ItemHandle =
		| 'self'
		| 'deana'
		| 'shelf'
		| 'anything-but-analog'
		| 'thoughts'
		| 'sounds';

	const UNIQUE_ITEMS: { label: string; handle: ItemHandle; href: string }[] = [
		{ label: 'self', handle: 'self', href: '/self' },
		{ label: 'sounds', handle: 'sounds', href: '/sounds' },
		{ label: 'thoughts', handle: 'thoughts', href: '/thoughts' },
		{ label: 'D-ANA', handle: 'deana', href: '/deana' },
		{ label: 'shelf', handle: 'shelf', href: '/shelf' },
		{ label: 'analog', handle: 'anything-but-analog', href: '/anything-but-analog' },
	];

	const UNIQUE_COUNT = UNIQUE_ITEMS.length;
	const LOOPED = [...UNIQUE_ITEMS, ...UNIQUE_ITEMS].map((it, i) => ({ id: i, ...it }));

	const CARD_GAP = 24;
	const SPEED = 30;
	const LOOKAHEAD = 1;

	function paletteFor(i: number): 'cream' | 'dark' {
		return (i % UNIQUE_COUNT) % 2 === 0 ? 'cream' : 'dark';
	}

	let stripEl: HTMLDivElement | undefined = $state();
	// `activeRange` tracks the current viewport buffer (can shrink in both
	// directions as the user scrolls). `mountedHi` is the monotonic high-
	// water mark — once a card has ever entered the buffer it stays mounted.
	//
	// Why sticky mount? WebGL shader compile is the dominant cost of mounting
	// a hero canvas (~80 ms long task, observed). Paying it once per card on
	// first scroll-pass and never again is much smoother than churning mounts
	// on every loop of the strip. Off-screen ticking is suppressed inside
	// each canvas (IO in metaball/voronoi/particle-text/EyeOcean; sketch-host
	// pauses when its `active` prop drops to false — we pass `inView(i)`
	// there so it stops between in-viewport visits).
	let activeRange = $state<[number, number]>([0, 0]);
	let mountedHi = $state(-1);
	let canvasesArmed = $state(false);

	// `isActive`: has this card ever been in the buffer? Governs mount.
	function isActive(i: number): boolean {
		return canvasesArmed && i <= mountedHi;
	}

	// `inView`: is this card currently in the viewport buffer? Used as the
	// `active` prop for sketch-host so off-screen sketches stop ticking.
	function inView(i: number): boolean {
		return i >= activeRange[0] && i <= activeRange[1];
	}

	// Canvas modules loaded on demand, cached by handle.
	const moduleCache = new Map<string, Promise<Component<any>>>();

	function getCanvasModule(handle: string): Promise<Component<any>> {
		if (moduleCache.has(handle)) return moduleCache.get(handle)!;
		let p: Promise<Component<any>>;
		if (handle === 'self') {
			p = import('$lib/components/canvas/VoronoiCanvas.svelte').then((m) => m.default);
		} else if (handle === 'deana') {
			p = import('$lib/components/messages/EmojiCardBg.svelte').then((m) => m.default);
		} else if (handle === 'shelf') {
			p = import('$lib/components/canvas/MetaballCanvas.svelte').then((m) => m.default);
		} else if (handle === 'anything-but-analog') {
			p = import('$lib/components/canvas/ParticleTextCanvas.svelte').then((m) => m.default);
		} else if (handle === 'thoughts') {
			p = import('$lib/components/art/SketchHost.svelte').then((m) => m.default);
		} else if (handle === 'sounds') {
			p = import('$lib/sounds/EyeOcean.svelte').then((m) => m.default);
		} else {
			p = Promise.resolve(undefined as unknown as Component<any>);
		}
		moduleCache.set(handle, p);
		return p;
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

			// Throttle canvas work only while actively autoscrolling or being
			// dragged/flung — NOT while the strip glides to a stop on hover.
			// Otherwise the cursor-reactive cards (analog repel, shelf metaballs)
			// stay at 30fps through the ~0.6s deceleration and feel laggy the moment
			// you hover to interact. Ample headroom exists (60fps holds at 6x CPU)
			// to run them full-rate during the brief glide.
			const autoscrolling = targetSpeedRef !== 0 && Math.abs(speedRef) > 0.5;
			const dragging = drag.active || Math.abs(drag.velocity) > 0.5;
			setCanvasThrottled(autoscrolling || dragging);

			const stride = stripW / UNIQUE_COUNT;
			if (measured && stride > 0) {
				const sectionW = section.clientWidth;
				const first = Math.floor(offsetRef / stride) - LOOKAHEAD;
				const last = Math.ceil((offsetRef + sectionW) / stride) + LOOKAHEAD - 1;
				const lo = Math.max(0, first);
				let hi = Math.min(LOOPED.length - 1, last);
				const cur = activeRangeRef;
				// Slow-expand hi by 1 per frame so a fast scroll doesn't
				// stack many mounts in the same frame — keeps the warm-up
				// jank distributed.
				if (hi > cur[1] + 1) hi = cur[1] + 1;
				if (cur[0] !== lo || cur[1] !== hi) {
					activeRangeRef = [lo, hi];
					activeRange = [lo, hi];
				}
				// Sticky high-water mark: once a card has been in the buffer,
				// keep it mounted. The canvases inside pause themselves when
				// scrolled off, so mounted-but-offscreen is near-free.
				if (hi > mountedHi) mountedHi = hi;
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

		// Arm canvases at first idle so their setup never competes with
		// hydration or the LCP paint. timeout guarantees they still appear on
		// busy main threads; rAF fallback covers browsers without rIC.
		const useIdle = typeof requestIdleCallback === 'function';
		function arm() {
			canvasesArmed = true;
		}
		const armHandle = useIdle
			? requestIdleCallback(arm, { timeout: 2000 })
			: requestAnimationFrame(() => requestAnimationFrame(arm));

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
			if (useIdle) cancelIdleCallback(armHandle);
			else cancelAnimationFrame(armHandle);
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

	let didDrag = false;

	function handleClick(e: MouseEvent, item: { href: string; handle: string }) {
		if (didDrag) {
			e.preventDefault();
			return;
		}
		e.preventDefault();
		window.umami?.track('gallery-card-click', { handle: item.handle });
		window.location.href = item.href;
	}
</script>

<section
	class="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
	style="touch-action: none; padding: {CARD_GAP}px;"
	data-gallery-strip
>
	<div
		bind:this={stripEl}
		class="flex h-full"
		style="gap: {CARD_GAP}px; will-change: transform;"
	>
		{#each LOOPED as item, i (item.id + '-' + i)}
			{@const visible = isActive(i)}
			{@const cream = paletteFor(i) === 'cream'}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<a
				href={item.href}
				draggable="false"
				data-sveltekit-preload-data="off"
				onclick={(e) => handleClick(e, item)}
				class="gallery-card group relative flex h-full shrink-0 flex-col overflow-hidden rounded-2xl shadow-sm transition-[transform,box-shadow] duration-700 hover:shadow-none hover:[transform:rotate(-1.3deg)]"
				style="aspect-ratio: 20 / 29;"
			>
				<!-- image area: locked to 4:5 so canvases that bake at that
				     aspect (deana ASCII matrix etc.) render without stretch.
				     The card aspect (20:29) is 4:5 + ~14% fixed-height label.
				     Cream by default; shelf overrides to dark because the
				     coin-blob metaballs need a dark canvas to read as
				     blooming gold. -->
				<div
					class="relative w-full overflow-hidden {item.handle === 'shelf'
						? 'bg-black'
						: 'bg-white'}"
					style="aspect-ratio: 4 / 5;"
				>
					{#if visible}
						<div class="absolute inset-0">
							{#await getCanvasModule(item.handle) then CanvasComp}
								{#if item.handle === 'self'}
									<CanvasComp
										invert
										showLetters={false}
										imageSrc="/assets/self-hero-mobile.webp"
										scale={20}
										fit="cover"
									/>
								{:else if item.handle === 'deana'}
									<CanvasComp />
								{:else if item.handle === 'shelf'}
									<!-- Cream (--white) blobs on the dark card background — read as
									     bright glowing forms regardless of which book is featured. -->
									<CanvasComp color={[245 / 255, 244 / 255, 240 / 255]} />
								{:else if item.handle === 'anything-but-analog'}
									<CanvasComp countOverride={4000} hideText pointSize={2} repelRadius={50} lowDpr />
								{:else if item.handle === 'thoughts'}
									<CanvasComp slug="30" active={inView(i)} interactive={false} />
								{:else if item.handle === 'sounds'}
									<CanvasComp fixed={false} />
								{/if}
							{/await}
						</div>
					{/if}
				</div>
				<!-- label: below the image, full width, centered. Palette alternates
				     per card. On hover the label bg matches the border ring
				     (coin) so the card "lights up" as a single unit; text
				     goes black so it stays legible on the gold. -->
				<div
					data-card-label
					class="flex flex-1 items-center justify-center px-3 text-center font-mono text-xl font-bold uppercase tracking-pill transition-colors duration-700 group-hover:bg-coin group-hover:text-black lg:text-2xl {cream
						? 'bg-white text-black'
						: 'bg-black text-white'}"
				>
					{#if item.handle === 'deana'}
						<DanaLabel />
					{:else}
						{item.label}
					{/if}
				</div>
				<!-- Border overlay: transparent ring at rest, coin on hover.
				     Inset so it paints crisply over the canvas + label. -->
				<div
					class="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-transparent ring-inset transition-shadow duration-700 group-hover:ring-coin"
				></div>
			</a>
		{/each}
	</div>
</section>
