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
  wetyu_log_clear(): void;
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
        // The performance so far: [t, op, a_bits, b_bits] quads, copied out
        // and cleared so the next take starts fresh.
        const words = new Uint32Array(mem, this.x.wetyu_log_ptr(), this.x.wetyu_log_len() * 4).slice();
        this.x.wetyu_log_clear();
        this.port.postMessage(['log', words], [words.buffer]);
        return;
      }
      const [op, a, b] = e.data;
      this.x.wetyu_command(op, a, b);
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.dead) return false;
    const input = inputs[0]?.[0];
    if (input?.length === BLOCK) {
      this.inView.set(input);
    } else {
      this.inView.fill(0);
    }
    try {
      this.x.wetyu_process(BLOCK);
    } catch (error) {
      // A wasm trap leaves the instance unusable; tell the page and stop.
      this.dead = true;
      this.port.postMessage(['crash', String(error)]);
      return false;
    }
    for (const channel of outputs[0] ?? []) {
      channel.set(this.outView);
    }
    if (++this.n % STATUS_EVERY === 0) {
      this.port.postMessage(Array.from(this.statusView));
    }
    return true;
  }
}

registerProcessor('wetyu', Wetyu);
