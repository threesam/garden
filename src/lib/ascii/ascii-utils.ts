/** Sample an image to a pixel grid using cover-fit */
export function sampleImage(
	img: HTMLImageElement,
	cols: number,
	rows: number,
	w: number,
	h: number,
	sampleCanvas: HTMLCanvasElement
): Uint8ClampedArray | null {
	if (!img.complete || !img.naturalWidth) return null;

	sampleCanvas.width = cols;
	sampleCanvas.height = rows;
	const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })!;

	const imgAspect = img.naturalWidth / img.naturalHeight;
	const containerAspect = w / h;
	let sx = 0,
		sy = 0,
		sw = img.naturalWidth,
		sh = img.naturalHeight;
	if (imgAspect > containerAspect) {
		sw = img.naturalHeight * containerAspect;
		sx = (img.naturalWidth - sw) / 2;
	} else {
		sh = img.naturalWidth / containerAspect;
		sy = (img.naturalHeight - sh) / 2;
	}
	sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
	return sCtx.getImageData(0, 0, cols, rows).data;
}

/** Compute grid dimensions from container size */
export function getGrid(w: number, h: number, cellSize = 3, heightRatio = 1.8) {
	const cols = Math.floor(w / cellSize);
	const rows = Math.floor(h / (cellSize * heightRatio));
	return { cols, rows };
}
