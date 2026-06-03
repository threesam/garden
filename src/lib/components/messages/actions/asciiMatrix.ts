import type { Action } from 'svelte/action';
import { ASCII_RAMP, type AsciiMatrix } from '$lib/deana/ascii-matrices.js';

const FADE_MS = 800;
const CYCLE_MS = 3000;

export interface AsciiMatrixConfig {
	matrices: AsciiMatrix[];
	/** Fires exactly once, after the first frame is actually painted. */
	onReady?: () => void;
}

// Build glyph -> tone (0..1) lookup once at module load. RAMP is brightness-
// ordered, so the index *is* the tone bucket. Each cell uses this to derive
// its fill-opacity (no second matrix needed in the bake output).
const TONE_OF: Record<string, number> = {};
for (let i = 0; i < ASCII_RAMP.length; i++) {
	TONE_OF[ASCII_RAMP[i]] = i / (ASCII_RAMP.length - 1);
}

interface ParsedMatrix {
	cols: number;
	rows: number;
	lines: string[];
}

function parse(m: AsciiMatrix): ParsedMatrix {
	return { cols: m.cols, rows: m.rows, lines: m.chars.split('\n') };
}

export const asciiMatrix: Action<HTMLCanvasElement, AsciiMatrixConfig> = (canvas, config) => {
	let { matrices, onReady } = config;
	const parsed = matrices.map(parse);
	const container = canvas.parentElement as HTMLDivElement;

	let currentIdx = 0;
	let rafId = 0;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let lastW = 0;
	let lastH = 0;
	let firstFramePainted = false;

	function setupCanvas(w: number, h: number) {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		lastW = w;
		lastH = h;
	}

	function renderMatrix(idx: number, blendIdx?: number, t = 0) {
		const w = container.offsetWidth;
		const h = container.offsetHeight;
		if (w === 0 || h === 0) return;
		if (w !== lastW || h !== lastH) setupCanvas(w, h);

		const m = parsed[idx];
		const cellW = w / m.cols;
		const cellH = h / m.rows;
		const fontSize = Math.max(4, Math.floor(cellH * 0.9));

		const ctx = canvas.getContext('2d')!;
		const dpr = window.devicePixelRatio || 1;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
		ctx.textBaseline = 'top';
		ctx.fillStyle = 'rgb(20, 20, 20)';

		const blend = blendIdx != null ? parsed[blendIdx] : null;
		// Smoothstep keeps the crossfade easing on the canvas glyphs in sync
		// with the CSS opacity ramps used elsewhere (AsciiImage etc.).
		const smooth = t * t * (3 - 2 * t);
		const rampMax = ASCII_RAMP.length - 1;

		for (let y = 0; y < m.rows; y++) {
			const line = m.lines[y] ?? '';
			const blendLine = blend ? (blend.lines[y] ?? '') : '';
			for (let x = 0; x < m.cols; x++) {
				const glyphA = line[x] ?? ' ';
				const glyphB = blend ? (blendLine[x] ?? ' ') : glyphA;
				// Lerp the RAMP index between the two glyphs, then pick the
				// glyph at the lerped index. Each cell walks smoothly through
				// the ramp during the crossfade instead of hard-swapping at
				// midpoint (which read as a sudden snap).
				const idxA = TONE_OF[glyphA] ?? 0;
				const idxB = TONE_OF[glyphB] ?? 0;
				const tone = idxA * (1 - smooth) + idxB * smooth;
				const glyph = ASCII_RAMP[Math.round(tone * rampMax)] ?? ' ';
				if (glyph === ' ') continue;
				ctx.globalAlpha = 0.2 + tone * 0.75;
				ctx.fillText(glyph, x * cellW, y * cellH);
			}
		}
		ctx.globalAlpha = 1;

		if (!firstFramePainted) {
			firstFramePainted = true;
			onReady?.();
		}
	}

	function renderStatic() {
		// Cancel any in-flight crossfade + scheduled next-cycle so we don't
		// race the resize repaint. Restart the cycle clock from this static
		// frame.
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
		if (timerId) clearTimeout(timerId);
		timerId = null;
		renderMatrix(currentIdx);
		scheduleNext();
	}

	function startTransition() {
		if (parsed.length < 2) return;
		const nextIdx = (currentIdx + 1) % parsed.length;
		const start = performance.now();

		function step(now: number) {
			const t = Math.max(0, Math.min(1, (now - start) / FADE_MS));
			renderMatrix(currentIdx, nextIdx, t);
			if (t < 1) {
				rafId = requestAnimationFrame(step);
			} else {
				currentIdx = nextIdx;
				scheduleNext();
			}
		}
		rafId = requestAnimationFrame(step);
	}

	function scheduleNext() {
		if (parsed.length < 2) return;
		timerId = setTimeout(startTransition, CYCLE_MS);
	}

	let resizeTimeout: ReturnType<typeof setTimeout>;
	const onResize = () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(renderStatic, 150);
	};
	const ro = new ResizeObserver(onResize);
	ro.observe(container);

	// Kick off after a frame so the container has been laid out. renderStatic
	// itself schedules the next crossfade.
	requestAnimationFrame(renderStatic);

	return {
		update(next: AsciiMatrixConfig) {
			if (next.matrices !== matrices) {
				matrices = next.matrices;
				const reparsed = matrices.map(parse);
				parsed.length = 0;
				parsed.push(...reparsed);
				currentIdx = 0;
				renderStatic();
			}
		},
		destroy() {
			cancelAnimationFrame(rafId);
			if (timerId) clearTimeout(timerId);
			clearTimeout(resizeTimeout);
			ro.disconnect();
		},
	};
};
