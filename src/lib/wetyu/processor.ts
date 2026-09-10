// The AudioWorkletProcessor: a thin shim around the wasm engine. Everything
// musical happens in Rust; this file copies 128 floats in, calls process,
// copies 128 floats out, and forwards events. No allocation on the hot path
// beyond the ~45 Hz status message.
import { OP, STATUS_LEN, type Msg } from './protocol';

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
  wetyu_set_tempo(bpm: number): void;
  wetyu_transport(on: number): void;
  wetyu_note(midi: number, on: number): void;
  wetyu_drum(pad: number): void;
  wetyu_record(ch: number): void;
  wetyu_hold(ch: number, on: number): void;
  wetyu_clear(ch: number): void;
  wetyu_set_click(on: number): void;
  wetyu_set_mic_monitor(on: number): void;
  wetyu_set_mic_offset(samples: number): void;
  wetyu_panic(): void;
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
    this.port.onmessage = (e: MessageEvent<Msg>) => {
      this.dispatch(e.data);
    };
  }

  private dispatch([op, a, b]: Msg): void {
    const x = this.x;
    switch (op) {
      case OP.tempo: x.wetyu_set_tempo(a); break;
      case OP.transport: x.wetyu_transport(a); break;
      case OP.note: x.wetyu_note(a, b); break;
      case OP.drum: x.wetyu_drum(a); break;
      case OP.record: x.wetyu_record(a); break;
      case OP.hold: x.wetyu_hold(a, b); break;
      case OP.clear: x.wetyu_clear(a); break;
      case OP.click: x.wetyu_set_click(a); break;
      case OP.micMonitor: x.wetyu_set_mic_monitor(a); break;
      case OP.micOffset: x.wetyu_set_mic_offset(a); break;
      case OP.panic: x.wetyu_panic(); break;
      default: break;
    }
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
