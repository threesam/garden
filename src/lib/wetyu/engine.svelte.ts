// Main-thread side of wetyu. Owns the AudioContext, the worklet node and the
// mic; exposes reactive state for the page. Every musical action is one
// postMessage — call it before touching any state so the audio thread never
// waits on a render.
import processorUrl from './processor?worker&url';
import { CHANNEL_NAMES } from './keys';
import { OP, STATUS_LEN } from './protocol';
import { defaultMicOffsetMs, msToSamples } from './timing';

export type ChannelState = 'empty' | 'recording' | 'until' | 'looping';
const STATE_NAMES: readonly ChannelState[] = ['empty', 'recording', 'until', 'looping'];

export interface ChannelView {
  name: string;
  state: ChannelState;
  /** Loop length in bars once decided. */
  bars: number;
  /** 0..1 through the loop, or bars elapsed while recording (may be negative while waiting). */
  pos: number;
  gate: number;
  held: boolean;
}

export type MicState = 'off' | 'pending' | 'on' | 'denied';

const WASM_URL = '/wasm/wetyu.wasm';
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    // Chrome drops the input buffer to its platform minimum for this.
    latency: 0,
  } as MediaTrackConstraints,
};

class Wetyu {
  ready = $state(false);
  error = $state<string | null>(null);
  playing = $state(false);
  bpm = $state(120);
  locked = $state(false);
  /** Bars elapsed on the transport. */
  position = $state(0);
  channels = $state<ChannelView[]>(
    CHANNEL_NAMES.map((name) => ({ name, state: 'empty', bars: 0, pos: 0, gate: 0, held: false })),
  );
  selected = $state(2);
  octave = $state(4);
  /** 128-frame output buffer (numeric latencyHint) vs the browser default. */
  tight = $state(true);
  click = $state(false);
  latencyMs = $state(0);
  sampleRate = $state(48000);
  mic = $state<MicState>('off');
  micMonitor = $state(false);
  micOffsetMs = $state(20);

  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private module: WebAssembly.Module | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private gen = 0;
  /** outputLatency is only meaningful once rendering has begun. */
  private latencyStale = true;

  async boot(): Promise<void> {
    const myGen = ++this.gen;
    this.ready = false;
    this.error = null;
    try {
      this.module ??= await loadModule();
      const ctx = new AudioContext({ latencyHint: this.tight ? 0 : 'interactive' });
      await ctx.audioWorklet.addModule(processorUrl);
      if (myGen !== this.gen) {
        await ctx.close();
        return;
      }
      const node = new AudioWorkletNode(ctx, 'wetyu', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        processorOptions: { module: this.module },
      });
      node.port.onmessage = (e: MessageEvent<number[] | [string, string]>) => {
        this.onMessage(e.data);
      };
      node.onprocessorerror = () => {
        this.error = 'the engine crashed — reload the page';
      };
      node.connect(ctx.destination);
      this.ctx = ctx;
      this.node = node;
      this.sampleRate = ctx.sampleRate;
      this.latencyStale = true;
      this.updateLatency();
      // Re-apply settings the engine doesn't know yet (fresh instance).
      this.send(OP.tempo, this.bpm);
      this.send(OP.click, +this.click);
      this.send(OP.micMonitor, +this.micMonitor);
      this.send(OP.micOffset, msToSamples(this.micOffsetMs, ctx.sampleRate));
      if (this.micStream) this.attachMic(this.micStream);
      this.ready = true;
    } catch (error) {
      this.error = String(error);
    }
  }

  /** First user gesture: browsers create contexts suspended. */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'running') await this.ctx.resume();
  }

  destroy(): void {
    this.gen++;
    this.node?.disconnect();
    this.node = null;
    void this.ctx?.close();
    this.ctx = null;
    for (const track of this.micStream?.getTracks() ?? []) track.stop();
    this.micStream = null;
    this.micSource = null;
    this.ready = false;
  }

  private send(op: number, a = 0, b = 0): void {
    this.node?.port.postMessage([op, a, b]);
  }

  // ---- actions ---------------------------------------------------------

  hold(ch: number, on: boolean): void {
    this.send(OP.hold, ch, +on);
    const c = this.channels[ch];
    if (c) c.held = on;
  }

  note(midi: number, on: boolean): void {
    this.send(OP.note, midi, +on);
  }

  drum(pad: number): void {
    this.send(OP.drum, pad);
  }

  record(ch = this.selected): void {
    this.send(OP.record, ch);
  }

  clear(ch = this.selected): void {
    this.send(OP.clear, ch);
  }

  toggleTransport(): void {
    this.send(OP.transport, this.playing ? 0 : 1);
  }

  setTempo(bpm: number): void {
    if (this.locked || !Number.isFinite(bpm)) return;
    this.bpm = Math.min(240, Math.max(40, Math.round(bpm)));
    this.send(OP.tempo, this.bpm);
  }

  setClick(on: boolean): void {
    this.click = on;
    this.send(OP.click, +on);
  }

  setMicMonitor(on: boolean): void {
    this.micMonitor = on;
    this.send(OP.micMonitor, +on);
  }

  setMicOffsetMs(ms: number): void {
    this.micOffsetMs = Math.min(100, Math.max(0, Math.round(ms)));
    this.send(OP.micOffset, msToSamples(this.micOffsetMs, this.sampleRate));
  }

  /** Release everything (blur, tab hidden). */
  panic(): void {
    this.send(OP.panic);
    for (const c of this.channels) c.held = false;
  }

  async setTight(tight: boolean): Promise<void> {
    if (tight === this.tight) return;
    this.tight = tight;
    this.node?.disconnect();
    this.node = null;
    await this.ctx?.close();
    this.ctx = null;
    await this.boot();
    await this.resume();
  }

  async enableMic(): Promise<void> {
    if (this.mic === 'on' || this.mic === 'pending') return;
    this.mic = 'pending';
    try {
      const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      this.micStream = stream;
      this.attachMic(stream);
      this.mic = 'on';
    } catch {
      this.mic = 'denied';
    }
  }

  // ---- internals -------------------------------------------------------

  private attachMic(stream: MediaStream): void {
    if (!this.ctx || !this.node) return;
    this.micSource?.disconnect();
    this.micSource = this.ctx.createMediaStreamSource(stream);
    this.micSource.connect(this.node);
    const settings = stream.getAudioTracks()[0]?.getSettings() as { latency?: number } | undefined;
    const base = this.ctx.baseLatency;
    const output = (this.ctx as { outputLatency?: number }).outputLatency ?? 0;
    this.setMicOffsetMs(defaultMicOffsetMs(base, output, settings?.latency));
  }

  private updateLatency(): void {
    if (!this.ctx) return;
    const output = (this.ctx as { outputLatency?: number }).outputLatency ?? 0;
    this.latencyMs = Math.round((this.ctx.baseLatency + output) * 1000 * 10) / 10;
  }

  private onMessage(data: number[] | [string, string]): void {
    if (typeof data[0] === 'string') {
      this.error = `the engine crashed (${String(data[1])}) — reload the page`;
      return;
    }
    const s = data as number[];
    if (s.length < STATUS_LEN) return;
    if (this.latencyStale) {
      this.latencyStale = false;
      this.updateLatency();
    }
    const bar = s[2] ?? 1;
    this.playing = s[0] === 1;
    this.bpm = s[1] ?? this.bpm;
    this.position = (s[3] ?? 0) / bar;
    let locked = false;
    this.channels.forEach((c, i) => {
      const base = 4 + 4 * i;
      const state = STATE_NAMES[s[base] ?? 0] ?? 'empty';
      if (state !== 'empty') locked = true;
      c.state = state;
      c.bars = s[base + 1] ?? 0;
      c.pos = s[base + 2] ?? 0;
      c.gate = s[base + 3] ?? 0;
    });
    this.locked = locked;
  }
}

async function loadModule(): Promise<WebAssembly.Module> {
  // compileStreaming needs an application/wasm MIME type, which is a host
  // setting; fall back to buffering the bytes so a config drift can't take
  // the page down. (Same dance as physarum-worker.ts.)
  const response = await fetch(WASM_URL);
  const buffered = response.clone();
  try {
    return await WebAssembly.compileStreaming(response);
  } catch {
    return WebAssembly.compile(await buffered.arrayBuffer());
  }
}

export const wetyu = new Wetyu();
