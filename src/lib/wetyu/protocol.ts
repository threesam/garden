// Main thread ↔ worklet wire format: a 3-number array per command, mirrored
// by `wetyu::op` in rust/wetyu/src/lib.rs. Small enough that structured clone
// is microseconds, and the worklet handles it before the next render quantum
// — no SharedArrayBuffer (and no COOP/COEP) needed.

export const OP = {
  tempo: 0,
  /** a: 0 stop, 1 start, 2 toggle (decided on the audio thread). */
  transport: 1,
  note: 2,
  drum: 3,
  record: 4,
  hold: 5,
  clear: 6,
  click: 7,
  micMonitor: 8,
  micOffset: 9,
  panic: 10,
  fx: 11,
  selectFx: 12,
} as const;

export type Msg = [op: number, a: number, b: number];

/** Worklet → page: the status block, a crash, or the performance log + end clock. */
export type Reply = number[] | ['crash', string] | ['log', Uint32Array, number];

/** Ask the worklet to post the log (`['log', words, clock]`) — see `takeLog`. */
export const TAKE_LOG = 'log';
/** Events the engine keeps before it stops logging. Mirrors LOG_CAP in lib.rs. */
export const LOG_CAP = 65536;

/** `[playing, bpm, bar, t]` then `CH_FIELDS` per channel. Mirrors lib.rs. */
export const CHANNELS = 3;
export const CH_FIELDS = 6;
export const STATUS_LEN = 4 + CH_FIELDS * CHANNELS;

/** Built-in effect plugins, in default channel order: mic, keys, drums. */
export const FX = ['delay', 'octaver', 'crush'] as const;
