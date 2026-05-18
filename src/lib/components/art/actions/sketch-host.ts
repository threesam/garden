import type { Action } from 'svelte/action';
import { getSketch } from '$lib/art/registry';
import { mulberry32 } from '$lib/art/rng';
import { makeNoise } from '$lib/art/noise';
import { shouldSkipThrottledFrame } from '$lib/perf-flags';

export interface SketchHostParams {
	slug: string;
	seed?: number;
	/**
	 * When true the sketch ticks. When false it tears down — cancels its rAF,
	 * runs cleanup, and clears the canvas pixel buffer.
	 */
	active: boolean;
}

/**
 * Svelte action that owns the full sketch lifecycle on a canvas element.
 * The parent must be a positioned container whose dimensions the canvas
 * should fill.
 *
 * Usage:
 *   <canvas use:sketchHost={{ slug, active }}></canvas>
 */
export const sketchHost: Action<HTMLCanvasElement, SketchHostParams> = (
	canvas,
	initialParams,
) => {
	let params = { ...initialParams };

	const maybeSketch = getSketch(params.slug);
	if (!maybeSketch) return {};
	const sketch = maybeSketch;

	const actualSeed = params.seed ?? Math.floor(Math.random() * 1_000_000);
	const rng = mulberry32(actualSeed);
	const noise = makeNoise(actualSeed);

	let rafId = 0;
	let resizeTimeout: ReturnType<typeof setTimeout>;
	let cleanup: (() => void) | null = null;
	let tick: ((api: import('$lib/art/types').SketchAPI, frame: number) => void) | null = null;
	let frame = 0;
	let api: import('$lib/art/types').SketchAPI | null = null;
	let hasSetup = false;
	// Tracked separately so teardown/setup after an active change can read
	// the most recent value without closing over the initial props object.
	let activeRef = params.active;

	const container = canvas.parentElement as HTMLElement;

	function setupSketch() {
		const dpr = sketch.lowDpr ? 1 : (window.devicePixelRatio || 1);
		const w = container.offsetWidth;
		const h = container.offsetHeight;
		if (w === 0 || h === 0) return;

		if (!sketch.manualCanvas) {
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const ctx = canvas.getContext('2d')!;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			api = {
				ctx,
				w,
				h,
				dpr,
				rng,
				noise,
				lerp: (a, b, t) => a + (b - a) * t,
				map: (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1),
				dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
			};
		} else {
			api = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				ctx: null as any,
				w,
				h,
				dpr,
				rng,
				noise,
				lerp: (a, b, t) => a + (b - a) * t,
				map: (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1),
				dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
			};
		}

		const result = sketch.setup(api, canvas);
		if (result) {
			tick = result.tick ?? null;
			cleanup = result.cleanup ?? null;
		}
		frame = 0;
		hasSetup = true;
	}

	function teardownSketch() {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
		if (cleanup) cleanup();
		cleanup = null;
		tick = null;
		api = null;
		// Release the canvas pixel buffer.
		canvas.width = 0;
		canvas.height = 0;
		hasSetup = false;
	}

	function tickFrame() {
		rafId = 0;
		if (!activeRef || !api || !tick) return;
		if (shouldSkipThrottledFrame(frame)) {
			frame++;
			rafId = requestAnimationFrame(tickFrame);
			return;
		}
		tick(api, frame++);
		rafId = requestAnimationFrame(tickFrame);
	}

	function startTick() {
		if (rafId || !tick) return;
		rafId = requestAnimationFrame(tickFrame);
	}

	function stateSync() {
		if (activeRef) {
			if (!hasSetup) setupSketch();
			startTick();
		} else if (hasSetup) {
			teardownSketch();
		}
	}

	stateSync();

	const ro = new ResizeObserver(() => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			if (!hasSetup) return;
			teardownSketch();
			setupSketch();
			if (activeRef) startTick();
		}, 150);
	});
	ro.observe(container);

	return {
		update(newParams: SketchHostParams) {
			const wasActive = activeRef;
			activeRef = newParams.active;
			// If only active changed, sync without full teardown.
			if (newParams.slug === params.slug && newParams.seed === params.seed) {
				if (wasActive !== newParams.active) stateSync();
				params = { ...newParams };
				return;
			}
			// slug/seed changed — full re-init.
			params = { ...newParams };
			if (hasSetup) teardownSketch();
			stateSync();
		},
		destroy() {
			clearTimeout(resizeTimeout);
			ro.disconnect();
			if (hasSetup) teardownSketch();
		},
	};
};
