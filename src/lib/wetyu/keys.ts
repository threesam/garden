// Physical-key zones for wetyu. Keyed by `event.code` so W E T Y U are the
// same black keys on every layout. Digits gate loops, the A row is a piano,
// the Z row is a drum kit — no modes, everything always live.

export type Channel = 0 | 1 | 2;

export type Action =
  | { kind: 'hold'; ch: Channel }
  | { kind: 'note'; semitone: number }
  | { kind: 'drum'; pad: number }
  | { kind: 'record'; ch?: Channel }
  | { kind: 'select' }
  | { kind: 'transport' }
  | { kind: 'tempo'; delta: number }
  | { kind: 'click' }
  | { kind: 'clear' }
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
  ['KeyX', 'X', 'snare'],
  ['KeyC', 'C', 'clap'],
  ['KeyV', 'V', 'hat'],
  ['KeyB', 'B', 'open'],
  ['KeyN', 'N', 'tom'],
  ['KeyM', 'M', 'rim'],
] as const;

const TABLE = new Map<string, Action>([
  ['Digit1', { kind: 'hold', ch: 0 }],
  ['Digit2', { kind: 'hold', ch: 1 }],
  ['Digit3', { kind: 'hold', ch: 2 }],
  ...WHITE_KEYS.map(([code, semitone]): [string, Action] => [code, { kind: 'note', semitone }]),
  ...BLACK_KEYS.map(([code, semitone]): [string, Action] => [code, { kind: 'note', semitone }]),
  ...PADS.map(([code], pad): [string, Action] => [code, { kind: 'drum', pad }]),
  ['KeyR', { kind: 'record' }],
  // Not Tab: the page must stay tabbable for keyboard users.
  ['KeyQ', { kind: 'select' }],
  ['Space', { kind: 'transport' }],
  ['ArrowUp', { kind: 'tempo', delta: 1 }],
  ['ArrowDown', { kind: 'tempo', delta: -1 }],
  ['ArrowRight', { kind: 'tempo', delta: 5 }],
  ['ArrowLeft', { kind: 'tempo', delta: -5 }],
  ['Comma', { kind: 'octave', delta: -1 }],
  ['Period', { kind: 'octave', delta: 1 }],
  ['KeyL', { kind: 'click' }],
  ['Backspace', { kind: 'clear' }],
]);

/** Shift turns a loop's listen key into its record key. */
export function actionFor(code: string, shift = false): Action | undefined {
  const action = TABLE.get(code);
  if (shift && action?.kind === 'hold') return { kind: 'record', ch: action.ch };
  return action;
}

/** MIDI note for a semitone above C in the given octave (C4 = 60). */
export function midiFor(semitone: number, octave: number): number {
  return 12 * (octave + 1) + semitone;
}
