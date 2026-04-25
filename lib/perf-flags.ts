// Module-level flag the gallery sets while its strip is translating, read
// by hero canvases to skip alternate frames. Stays false on routes that
// don't mount the gallery, so heroes used elsewhere tick at full rate.
let canvasThrottled = false;

export const isCanvasThrottled = () => canvasThrottled;

export const setCanvasThrottled = (v: boolean) => {
  if (canvasThrottled === v) return;
  canvasThrottled = v;
};

export const shouldSkipThrottledFrame = (frame: number) =>
  canvasThrottled && (frame & 1) === 1;
