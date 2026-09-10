export function msToSamples(ms: number, sampleRate: number): number {
  return Math.round((ms / 1000) * sampleRate);
}

/**
 * Where a recorded mic loop should be shifted so it sits on the grid: the
 * player hears the click `base + output` late and their sound reaches us
 * `input` late. Browsers that don't report input latency get a 10 ms guess;
 * the slider on the page is the real calibration.
 */
export function defaultMicOffsetMs(
  baseLatency: number,
  outputLatency: number,
  inputLatency: number | undefined,
): number {
  return Math.round((baseLatency + outputLatency + (inputLatency ?? 0.01)) * 1000);
}
