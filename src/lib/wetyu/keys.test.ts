import { describe, expect, it } from 'vitest';
import { actionFor, midiFor } from './keys';

describe('keyboard zones', () => {
  it('maps digits to loop holds; shift records, option toggles the effect', () => {
    expect(actionFor('Digit1')).toEqual({ kind: 'hold', ch: 0 });
    expect(actionFor('Digit3')).toEqual({ kind: 'hold', ch: 2 });
    expect(actionFor('Digit2', { shift: true })).toEqual({ kind: 'record', ch: 1 });
    expect(actionFor('Digit2', { alt: true })).toEqual({ kind: 'fx', ch: 1 });
    // shift does nothing to the other zones; option is left to the OS
    expect(actionFor('KeyZ', { shift: true })).toEqual({ kind: 'drum', pad: 0 });
    expect(actionFor('KeyZ', { alt: true })).toBeUndefined();
  });

  it('saves on cmd+s and swallows every other cmd chord', () => {
    expect(actionFor('KeyS', { meta: true })).toEqual({ kind: 'save' });
    expect(actionFor('KeyA', { meta: true })).toBeUndefined();
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
    expect(actionFor('Slash')).toEqual({ kind: 'drum', pad: 9 });
    expect(actionFor('BracketRight')).toEqual({ kind: 'octave', delta: 1 });
  });

  it('ignores keys it does not own, and never takes Tab from the browser', () => {
    expect(actionFor('Tab')).toBeUndefined();
    expect(actionFor('Escape')).toBeUndefined();
    expect(actionFor('KeyQ')).toBeUndefined();
    expect(actionFor('Backspace')).toBeUndefined();
  });

  it('turns semitone + octave into a midi note', () => {
    expect(midiFor(0, 4)).toBe(60);
    expect(midiFor(12, 4)).toBe(72);
    expect(midiFor(1, 3)).toBe(49);
  });
});
