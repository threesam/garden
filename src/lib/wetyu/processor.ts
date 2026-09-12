// The AudioWorkletProcessor: a thin shim around the wasm engine. Everything
// musical happens in Rust; this file copies 128 floats in, calls process,
// copies 128 floats out, and forwards commands. No allocation on the hot
// path beyond the ~45 Hz status message.
import { STATUS_LEN, TAKE_LOG, type Msg } from './protocol';

// AudioWorkletGlobalScope isn't in lib.dom — declare the three things we use.
declare const sampleRate: number;
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}
declare function registerProcessor(
  name: string,
  ctor: new (options: AudioWorkletNodeOptions) => AudioWorkletProcessor,
): void;

interface Exports {
  memory: WebAssembly.Memory;
  wetyu_init(sampleRate: number): void;
  wetyu_in_ptr(): number;
  wetyu_out_ptr(): number;
  wetyu_status_ptr(): number;
  wetyu_process(frames: number): void;
  wetyu_command(op: number, a: number, b: number): void;
  wetyu_log_ptr(): number;
  wetyu_log_len(): number;
  wetyu_clock(): number;
}

const BLOCK = 128;
const STATUS_EVERY = 8; // ~47 Hz at 48 kHz

class Wetyu extends AudioWorkletProcessor {
  private readonly x: Exports;
  private readonly inView: Float32Array;
  private readonly outView: Float32Array;
  private readonly statusView: Float32Array;
  private n = 0;
  private dead = false;

  constructor(options: AudioWorkletNodeOptions) {
    super();
    const { module } = options.processorOptions as { module: WebAssembly.Module };
    this.x = new WebAssembly.Instance(module, {}).exports as unknown as Exports;
    this.x.wetyu_init(sampleRate);
    // Views are taken AFTER init: that's the only allocation the engine ever
    // makes, so memory never grows again and these never detach.
    const mem = this.x.memory.buffer;
    this.inView = new Float32Array(mem, this.x.wetyu_in_ptr(), BLOCK);
    this.outView = new Float32Array(mem, this.x.wetyu_out_ptr(), BLOCK);
    this.statusView = new Float32Array(mem, this.x.wetyu_status_ptr(), STATUS_LEN);
    this.port.onmessage = (e: MessageEvent<Msg | typeof TAKE_LOG>) => {
      if (e.data === TAKE_LOG) {
        // The whole session so far — [clock, op, a_bits, b_bits] quads — plus
        // the clock it ends at. Never cleared: a take only replays from a
        // fresh engine if it starts at the beginning.
        // ponytail: a one-off copy on a user action, ≤ 1 MiB; a click at worst.
        const words = new Uint32Array(mem, this.x.wetyu_log_ptr(), this.x.wetyu_log_len() * 4).slice();
        this.port.postMessage(['log', words, this.x.wetyu_clock()], [words.buffer]);
        return;
      }
      const [op, a, b] = e.data;
      this.x.wetyu_command(op, a, b);
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.dead) return false;
    const input = inputs[0]?.[0];
    const channels = outputs[0] ?? [];
    const frames = channels[0]?.length ?? BLOCK;
    // The spec fixes the quantum at 128, which is the engine's block; if a
    // browser ever renders bigger quanta, walk them in engine-sized chunks.
    for (let start = 0; start < frames; start += BLOCK) {
      const n = Math.min(BLOCK, frames - start);
      if (input) {
        this.inView.set(input.subarray(start, start + n));
      } else {
        this.inView.fill(0, 0, n);
      }
      try {
        this.x.wetyu_process(n);
      } catch (error) {
        // A wasm trap leaves the instance unusable; tell the page and stop.
        this.dead = true;
        this.port.postMessage(['crash', String(error)]);
        return false;
      }
      for (const channel of channels) {
        channel.set(this.outView.subarray(0, n), start);
      }
    }
    if (++this.n % STATUS_EVERY === 0) {
      // ponytail: one small array clone ~47×/s; a SharedArrayBuffer would need
      // cross-origin isolation for the whole page and buys nothing audible.
      this.port.postMessage(Array.from(this.statusView));
    }
    return true;
  }
}

registerProcessor('wetyu', Wetyu);
