import { describe, expect, it } from 'vitest';
import { actionFor, midiFor } from './keys';

describe('keyboard zones', () => {
  it('maps digits to loop holds, and shifted digits to record', () => {
    expect(actionFor('Digit1')).toEqual({ kind: 'hold', ch: 0 });
    expect(actionFor('Digit3')).toEqual({ kind: 'hold', ch: 2 });
    expect(actionFor('Digit2', true)).toEqual({ kind: 'record', ch: 1 });
    // shift does nothing to the other zones
    expect(actionFor('KeyZ', true)).toEqual({ kind: 'drum', pad: 0 });
  });

  it('maps the A row and the black keys to semitones', () => {
    expect(actionFor('KeyA')).toEqual({ kind: 'note', semitone: 0 });
    expect(actionFor('KeyW')).toEqual({ kind: 'note', semitone: 1 });
    expect(actionFor('KeyU')).toEqual({ kind: 'note', semitone: 10 });
    expect(actionFor('KeyK')).toEqual({ kind: 'note', semitone: 12 });
  });

  it('maps the Z row to pads in order', () => {
    expect(actionFor('KeyZ')).toEqual({ kind: 'drum', pad: 0 });
    expect(actionFor('KeyM')).toEqual({ kind: 'drum', pad: 6 });
  });

  it('ignores keys it does not own, and never takes Tab from the browser', () => {
    expect(actionFor('Tab')).toBeUndefined();
    expect(actionFor('Escape')).toBeUndefined();
    expect(actionFor('KeyQ')).toEqual({ kind: 'select' });
  });

  it('turns semitone + octave into a midi note', () => {
    expect(midiFor(0, 4)).toBe(60);
    expect(midiFor(12, 4)).toBe(72);
    expect(midiFor(1, 3)).toBe(49);
  });
});
