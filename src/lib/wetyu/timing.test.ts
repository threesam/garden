import { describe, expect, it } from 'vitest';
import { defaultMicOffsetMs, msToSamples } from './timing';

describe('timing', () => {
  it('converts ms to whole samples', () => {
    expect(msToSamples(2, 48000)).toBe(96);
    expect(msToSamples(20.5, 44100)).toBe(904);
  });

  it('defaults the mic offset to the round trip the browser reports', () => {
    expect(defaultMicOffsetMs(0.0027, 0.01, 0.005)).toBe(18);
    // no input figure → assume 10 ms
    expect(defaultMicOffsetMs(0.0027, 0.01, undefined)).toBe(23);
  });
});
