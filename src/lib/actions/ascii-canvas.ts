import { sampleImage, renderAsciiFrame, getGrid } from '$lib/ascii/ascii-utils.js';
import type { Action } from 'svelte/action';

export interface AsciiCanvasParams {
	src: string;
	cellSize?: number;
}

/**
 * Svelte action that renders an image as ASCII art onto a canvas element.
 * The canvas must be inside a positioned container element; the action reads
 * the container's offsetWidth/offsetHeight to size the canvas.
 */
export const asciiCanvas: Action<HTMLCanvasElement, AsciiCanvasParams> = (canvas, params) => {
	let { src, cellSize = 3 } = params ?? {};
	const img = new Image();
	const sample = document.createElement('canvas');
	let resizeTimeout: ReturnType<typeof setTimeout>;
	let ro: ResizeObserver | undefined;

	function paint() {
		const container = canvas.parentElement;
		if (!container || !img.complete || !img.naturalWidth) return;

		const dpr = window.devicePixelRatio || 1;
		const w = container.offsetWidth;
		const h = container.offsetHeight;
		if (w === 0 || h === 0) return;

		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;

		const { cols, rows } = getGrid(w, h, cellSize);
		const pixels = sampleImage(img, cols, rows, w, h, sample);
		if (!pixels) return;

		const ctx = canvas.getContext('2d')!;
		renderAsciiFrame(ctx, pixels, cols, rows, w, h, dpr);
	}

	function setupImage(newSrc: string, newCellSize: number) {
		src = newSrc;
		cellSize = newCellSize;
		img.src = src;
		img.onload = paint;
		if (img.complete) paint();
	}

	function setupResize() {
		const container = canvas.parentElement;
		if (!container) return;
		ro = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(paint, 150);
		});
		ro.observe(container);
	}

	setupImage(src, cellSize);
	setupResize();

	return {
		update(newParams: AsciiCanvasParams) {
			const newSrc = newParams.src;
			const newCellSize = newParams.cellSize ?? 3;
			if (newSrc !== src || newCellSize !== cellSize) {
				setupImage(newSrc, newCellSize);
			}
		},
		destroy() {
			clearTimeout(resizeTimeout);
			ro?.disconnect();
		}
	};
};
