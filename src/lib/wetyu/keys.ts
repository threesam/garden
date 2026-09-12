// Physical-key zones for wetyu. Keyed by `event.code` so W E T Y U are the
// same black keys on every layout. Digits gate loops, the A row is a piano,
// the Z row is a drum kit — no modes, everything always live.

export type Channel = 0 | 1 | 2;

export type Action =
  | { kind: 'hold'; ch: Channel }
  | { kind: 'note'; semitone: number }
  | { kind: 'drum'; pad: number }
  | { kind: 'record'; ch: Channel }
  | { kind: 'fx'; ch: Channel }
  | { kind: 'transport' }
  | { kind: 'tempo'; delta: number }
  | { kind: 'click' }
  | { kind: 'save' }
  | { kind: 'octave'; delta: number };

export const CHANNEL_NAMES = ['mic', 'keys', 'drums'] as const;

/** White keys left to right: code, semitone from C, printed label. */
export const WHITE_KEYS = [
  ['KeyA', 0, 'A'],
  ['KeyS', 2, 'S'],
  ['KeyD', 4, 'D'],
  ['KeyF', 5, 'F'],
  ['KeyG', 7, 'G'],
  ['KeyH', 9, 'H'],
  ['KeyJ', 11, 'J'],
  ['KeyK', 12, 'K'],
] as const;

/** Black keys: code, semitone, label, and which white key they sit after. */
export const BLACK_KEYS = [
  ['KeyW', 1, 'W', 0],
  ['KeyE', 3, 'E', 1],
  ['KeyT', 6, 'T', 3],
  ['KeyY', 8, 'Y', 4],
  ['KeyU', 10, 'U', 5],
] as const;

export const PADS = [
  ['KeyZ', 'Z', 'kick'],
  ['KeyX', 'X', 'tight'],
  ['KeyC', 'C', 'clap'],
  ['KeyV', 'V', 'snare'],
  ['KeyB', 'B', 'snap'],
  ['KeyN', 'N', 'open'],
  ['KeyM', 'M', 'hat'],
  ['Comma', ',', 'rim'],
  ['Period', '.', 'clav'],
  ['Slash', '/', 'cymbal'],
] as const;

const TABLE = new Map<string, Action>([
  ['Digit1', { kind: 'hold', ch: 0 }],
  ['Digit2', { kind: 'hold', ch: 1 }],
  ['Digit3', { kind: 'hold', ch: 2 }],
  ...WHITE_KEYS.map(([code, semitone]): [string, Action] => [code, { kind: 'note', semitone }]),
  ...BLACK_KEYS.map(([code, semitone]): [string, Action] => [code, { kind: 'note', semitone }]),
  ...PADS.map(([code], pad): [string, Action] => [code, { kind: 'drum', pad }]),
  ['Space', { kind: 'transport' }],
  ['ArrowUp', { kind: 'tempo', delta: 1 }],
  ['ArrowDown', { kind: 'tempo', delta: -1 }],
  ['ArrowRight', { kind: 'tempo', delta: 5 }],
  ['ArrowLeft', { kind: 'tempo', delta: -5 }],
  ['BracketLeft', { kind: 'octave', delta: -1 }],
  ['BracketRight', { kind: 'octave', delta: 1 }],
  ['KeyL', { kind: 'click' }],
]);

/**
 * Shift turns a loop's listen key into its record key; Option into its
 * effect toggle. Cmd+S saves the take. (Clear is a chord — hold the loop,
 * press Backspace — handled by the page, not a key of its own.)
 */
export function actionFor(
  code: string,
  mods: { shift?: boolean; alt?: boolean; meta?: boolean } = {},
): Action | undefined {
  if (mods.meta) return code === 'KeyS' ? { kind: 'save' } : undefined;
  const action = TABLE.get(code);
  if (action?.kind === 'hold') {
    if (mods.shift) return { kind: 'record', ch: action.ch };
    if (mods.alt) return { kind: 'fx', ch: action.ch };
  }
  return mods.alt ? undefined : action;
}

/** A press shorter than this is a tap (latch toggle); longer is a momentary hold. */
export const TAP_MS = 150;

/** MIDI note for a semitone above C in the given octave (C4 = 60). */
export function midiFor(semitone: number, octave: number): number {
  return 12 * (octave + 1) + semitone;
}
