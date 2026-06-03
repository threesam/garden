// Schedule work in an idle slot between scroll frames so heavy mounts
// (WebGL shader compiles, canvas first-frame paints) don't stack into a
// long task that blocks scroll. Falls back to setTimeout on browsers
// that don't ship requestIdleCallback (Safari < 17, etc.) — the work
// still defers to the next tick, which is enough to break the long-task
// stack.

const IDLE_TIMEOUT_MS = 2000;

/**
 * Run `cb` when the main thread is idle (or after 2 s, whichever comes
 * first). Returns a handle to pass to {@link cancelIdle}.
 */
export function scheduleIdle(cb: () => void): number {
	if (typeof requestIdleCallback === 'function') {
		return requestIdleCallback(cb, { timeout: IDLE_TIMEOUT_MS });
	}
	return setTimeout(cb, 1) as unknown as number;
}

/** Cancel a handle returned by {@link scheduleIdle}. */
export function cancelIdle(handle: number): void {
	if (typeof cancelIdleCallback === 'function') {
		cancelIdleCallback(handle);
	} else {
		clearTimeout(handle);
	}
}
