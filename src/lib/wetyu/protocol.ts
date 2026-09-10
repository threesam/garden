// Main thread ↔ worklet wire format: a 3-number array per event. Small enough
// that structured clone is microseconds, and the worklet handles it before
// the next render quantum — no SharedArrayBuffer (and no COOP/COEP) needed.

export const OP = {
  tempo: 0,
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
} as const;

export type Msg = [op: number, a: number, b: number];

/** `[playing, bpm, bar, t]` then `[state, bars, pos, gate]` per channel. Mirrors lib.rs. */
export const STATUS_LEN = 16;
