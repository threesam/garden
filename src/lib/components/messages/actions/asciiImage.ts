import type { Action } from 'svelte/action';
import { sampleImage, getGrid } from '$lib/ascii/ascii-utils.js';

const FADE_MS = 800;
const CYCLE_MS = 3000;

export interface AsciiImageConfig {
	srcs: string[];
	inverted?: boolean;
	/** Fires exactly once, after the first frame is actually painted to the
	 * canvas (not just on action mount). Consumers use this to fade the
	 * canvas in from opacity 0 so the lazy-mount doesn't pop. */
	onReady?: () => void;
}

export const asciiImage: Action<HTMLCanvasElement, AsciiImageConfig> = (canvas, config) => {
	const { onReady } = config;
	let { srcs, inverted = false } = config;
	let firstFramePainted = false;

	const container = canvas.parentElement as HTMLDivElement;
	const sample = document.createElement('canvas');

	let currentIdx = 0;
	let rafId = 0;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let lastW = 0;
	let lastH = 0;

	const pixelCache = new Map<string, Uint8ClampedArray>();

	const images: HTMLImageElement[] = srcs.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	});

	function getLayout() {
		const w = container.offsetWidth;
		const h = container.offsetHeight;
		const { cols, rows } = getGrid(w, h, 3);
		return { w, h, cols, rows };
	}

	function setupCanvas(w: number, h: number) {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		lastW = w;
		lastH = h;
		pixelCache.clear();
	}

	function sampleImg(
		img: HTMLImageElement,
		cols: number,
		rows: number,
		w: number,
		h: number
	): Uint8ClampedArray | null {
		if (!img.complete || !img.naturalWidth) return null;
		const key = `${img.src}:${cols}x${rows}`;
		const cached = pixelCache.get(key);
		if (cached) return cached;
		const pixels = sampleImage(img, cols, rows, w, h, sample);
		if (pixels) pixelCache.set(key, pixels);
		return pixels;
	}

	function renderFrame(pixels: Uint8ClampedArray, cols: number, rows: number, w: number, h: number) {
		const dpr = window.devicePixelRatio || 1;
		const cellW = w / cols;
		const cellH = h / rows;

		const ctx = canvas.getContext('2d')!;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		const fontSize = Math.max(4, Math.floor(cellH * 0.9));
		ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
		ctx.textBaseline = 'top';

		const ASCII_RAMP =
			" `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				// RGBA stride: pixels.length = cols * rows * 4, so off..off+2 are in-bounds.
				const off = (y * cols + x) * 4;
				const r = pixels[off]!;
				const g = pixels[off + 1]!;
				const b = pixels[off + 2]!;
				const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

				// lumToTone
				const stretched = Math.max(0, Math.min(1, (lum - 0.1) / 0.65));
				const s2 = stretched * stretched * (3 - 2 * stretched);
				const tone = 1 - s2 * s2 * (3 - 2 * s2);

				const effectiveTone = inverted ? 1 - tone : tone;
				const idx = Math.floor(effectiveTone * (ASCII_RAMP.length - 1));
				const glyph = ASCII_RAMP[idx] ?? ' ';
				if (glyph === ' ') continue;

				const alpha = 0.2 + effectiveTone * 0.75;
				ctx.fillStyle = inverted
					? `rgba(245, 244, 240, ${alpha})`
					: `rgba(20, 20, 20, ${alpha})`;
				ctx.fillText(glyph, x * cellW, y * cellH);
			}
		}

		if (!firstFramePainted) {
			firstFramePainted = true;
			onReady?.();
		}
	}

	function renderStatic() {
		const { w, h, cols, rows } = getLayout();
		if (w === 0 || h === 0) return;
		if (w !== lastW || h !== lastH) setupCanvas(w, h);
		const pixels = sampleImg(images[currentIdx]!, cols, rows, w, h);
		if (!pixels) return;
		renderFrame(pixels, cols, rows, w, h);
	}

	function startTransition() {
		if (srcs.length < 2) return;
		const nextIdx = (currentIdx + 1) % srcs.length;
		const { w, h, cols, rows } = getLayout();
		if (w === 0 || h === 0) return;
		if (w !== lastW || h !== lastH) setupCanvas(w, h);

		const cur = sampleImg(images[currentIdx]!, cols, rows, w, h);
		const nxt = sampleImg(images[nextIdx]!, cols, rows, w, h);
		if (!cur) return;
		const curPixels = cur;

		const startTime = performance.now();
		const blended = new Uint8ClampedArray(curPixels.length);

		function fadeStep(now: number) {
			const t = Math.max(0, Math.min(1, (now - startTime) / FADE_MS));
			const smooth = t * t * (3 - 2 * t);

			if (nxt) {
				for (let i = 0; i < curPixels.length; i++) {
					blended[i] = Math.floor(curPixels[i]! * (1 - smooth) + nxt[i]! * smooth);
				}
				renderFrame(blended, cols, rows, w, h);
			} else {
				renderFrame(curPixels, cols, rows, w, h);
			}

			if (t < 1) {
				rafId = requestAnimationFrame(fadeStep);
			} else {
				currentIdx = nextIdx;
				scheduleNext();
			}
		}

		rafId = requestAnimationFrame(fadeStep);
	}

	function scheduleNext() {
		if (srcs.length < 2) return;
		timerId = setTimeout(startTransition, CYCLE_MS);
	}

	let loaded = 0;
	let cancelled = false;
	const onLoad = () => {
		if (cancelled) return;
		loaded++;
		if (loaded === 1) {
			renderStatic();
			scheduleNext();
		}
	};
	for (const img of images) {
		if (img.complete && img.naturalWidth) onLoad();
		else img.onload = onLoad;
	}

	let resizeTimeout: ReturnType<typeof setTimeout>;
	const onResize = () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(renderStatic, 150);
	};
	const ro = new ResizeObserver(onResize);
	ro.observe(container);

	return {
		update(next: AsciiImageConfig) {
			// srcs/inverted changes after mount reset state
			if (next.srcs !== srcs || next.inverted !== inverted) {
				srcs = next.srcs;
				inverted = next.inverted ?? false;
				pixelCache.clear();
				renderStatic();
			}
		},
		destroy() {
			cancelled = true;
			cancelAnimationFrame(rafId);
			if (timerId) clearTimeout(timerId);
			clearTimeout(resizeTimeout);
			ro.disconnect();
			for (const img of images) img.onload = null;
		},
	};
};
