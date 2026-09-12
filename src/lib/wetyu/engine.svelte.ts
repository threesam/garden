// Main-thread side of wetyu. Owns the AudioContext, the worklet node and the
// mic; exposes reactive state for the page. Every musical action is one
// postMessage — call it before touching any state so the audio thread never
// waits on a render.
import processorUrl from './processor?worker&url';
import { CHANNEL_NAMES } from './keys';
import { CH_FIELDS, FX, LOG_CAP, OP, STATUS_LEN, TAKE_LOG, type Reply } from './protocol';
import { defaultMicOffsetMs, msToSamples } from './timing';

export type ChannelState = 'empty' | 'recording' | 'until' | 'looping' | 'overdub';
const STATE_NAMES: readonly ChannelState[] = ['empty', 'recording', 'until', 'looping', 'overdub'];

export interface ChannelView {
  name: string;
  state: ChannelState;
  /** Loop length in bars once decided. */
  bars: number;
  /** 0..1 through the loop, or bars elapsed while recording (may be negative while waiting). */
  pos: number;
  gate: number;
  /** Peak of this loop's output over the last block, post-effect. */
  level: number;
  /** Effect wet mix, 0..1. */
  fxWet: number;
  /** Index into FX: which plugin sits on this loop. */
  fx: number;
  /** The effect is switched in (the engine ramps `fxWet` toward it). */
  fxOn: boolean;
  /** The loop is gated in: latched by a tap, or held for the moment. */
  held: boolean;
}

/**
 * A performance: every command the engine ran, stamped with the render clock
 * (samples rendered since the engine was made, monotonic across stops).
 * Replaying it into a fresh engine at the same sample rate (with the same
 * mic input) reproduces the audio exactly — the seed for rendering
 * audio-visual pieces offline later.
 */
export interface PerformanceLog {
  sampleRate: number;
  /** Render clock the take ends at, so a renderer knows how long to run. */
  end: number;
  /** The engine's log filled up; commands after the last event are missing. */
  truncated: boolean;
  events: { t: number; op: number; a: number; b: number }[];
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
  channels = $state<ChannelView[]>(
    CHANNEL_NAMES.map((name, i) => ({
      name,
      state: 'empty',
      bars: 0,
      pos: 0,
      gate: 0,
      level: 0,
      fxWet: 0,
      fx: i,
      fxOn: false,
      held: false,
    })),
  );
  /** Sub bass lives low: C2 under the A key. */
  octave = $state(2);
  /** Engine sample clock, from the last status message. */
  t = $state(0);
  bar = $state(1);
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
  /** The one save in flight, if any; the worklet answers in order. */
  private logWaiter: ((words: Uint32Array, end: number) => void) | null = null;

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
      node.port.onmessage = (e: MessageEvent<Reply>) => {
        this.onMessage(e.data);
      };
      node.onprocessorerror = () => {
        this.error = 'the engine crashed — reload the page';
        this.flushLogWaiters();
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
      this.channels.forEach((c, i) => {
        this.send(OP.selectFx, i, c.fx);
      });
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
    this.flushLogWaiters();
    this.node?.disconnect();
    this.node = null;
    void this.ctx?.close();
    this.ctx = null;
    for (const track of this.micStream?.getTracks() ?? []) track.stop();
    this.micStream = null;
    this.micSource = null;
    this.mic = 'off';
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

  record(ch: number): void {
    this.send(OP.record, ch);
  }

  clear(ch: number): void {
    this.send(OP.clear, ch);
  }

  toggleTransport(): void {
    this.send(OP.transport, 2); // the engine decides; status here can be ~20 ms stale
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

  /** Option+digit: that loop's effect in (or out). */
  fx(ch: number, on: boolean): void {
    this.send(OP.fx, ch, +on);
    const c = this.channels[ch];
    if (c) c.fxOn = on;
  }

  selectFx(ch: number, id: number): void {
    if (id < 0 || id >= FX.length) return;
    this.send(OP.selectFx, ch, id);
    const c = this.channels[ch];
    if (c) c.fx = id;
  }

  /** Release everything (blur, tab hidden). */
  panic(): void {
    this.send(OP.panic);
    for (const c of this.channels) {
      c.held = false;
      c.fxOn = false;
    }
  }

  /** Pull the performance log out of the engine (and clear it there). */
  /** The whole session as a replayable log (see PerformanceLog). */
  takeLog(): Promise<PerformanceLog> {
    const node = this.node;
    if (!node) return Promise.resolve({ sampleRate: this.sampleRate, end: 0, truncated: false, events: [] });
    return new Promise((resolve) => {
      this.logWaiter = (words, end) => {
        const events = [];
        const floats = new Float32Array(words.buffer);
        for (let i = 0; i + 3 < words.length; i += 4) {
          events.push({ t: words[i] ?? 0, op: words[i + 1] ?? 0, a: floats[i + 2] ?? 0, b: floats[i + 3] ?? 0 });
        }
        resolve({ sampleRate: this.sampleRate, end, truncated: events.length >= LOG_CAP, events });
      };
      node.port.postMessage(TAKE_LOG);
    });
  }

  /** Rebuilds the context; the engine (and its loops) start over. */
  async setTight(tight: boolean): Promise<void> {
    if (tight === this.tight) return;
    if (this.locked && !window.confirm('switching latency mode clears the loops — go ahead?')) return;
    this.tight = tight;
    this.flushLogWaiters();
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

  /** A save waiting on a log gets an empty one when the engine goes away. */
  private flushLogWaiters(): void {
    this.logWaiter?.(new Uint32Array(0), 0);
    this.logWaiter = null;
  }

  private updateLatency(): void {
    if (!this.ctx) return;
    const output = (this.ctx as { outputLatency?: number }).outputLatency ?? 0;
    this.latencyMs = Math.round((this.ctx.baseLatency + output) * 1000 * 10) / 10;
  }

  private onMessage(data: Reply): void {
    if (data[0] === 'crash') {
      this.error = `the engine crashed (${data[1]}) — reload the page`;
      this.flushLogWaiters();
      return;
    }
    if (data[0] === 'log') {
      this.logWaiter?.(data[1], data[2]);
      this.logWaiter = null;
      return;
    }
    const s = data;
    if (s.length < STATUS_LEN) return;
    if (this.latencyStale) {
      this.latencyStale = false;
      this.updateLatency();
    }
    const bar = s[2] ?? 1;
    this.playing = s[0] === 1;
    this.bpm = s[1] ?? this.bpm;
    this.bar = bar;
    this.t = s[3] ?? 0;
    let locked = false;
    this.channels.forEach((c, i) => {
      const base = 4 + CH_FIELDS * i;
      const state = STATE_NAMES[s[base] ?? 0] ?? 'empty';
      if (state !== 'empty') locked = true;
      c.state = state;
      c.bars = s[base + 1] ?? 0;
      c.pos = s[base + 2] ?? 0;
      c.gate = s[base + 3] ?? 0;
      c.level = s[base + 4] ?? 0;
      c.fxWet = s[base + 5] ?? 0;
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
