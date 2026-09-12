<script lang="ts">
  // wetyu — three loops, always running. Hold 1/2/3 to hear one.
  //
  // Feel rule: every key handler sends to the audio thread FIRST, then lights
  // the key. Nothing here waits on a render before the engine hears about it.
  //
  // The picture is the default view while playing: a Visual plugin draws the
  // three loops as layers (keys back, drums middle, mic front) from engine
  // state only, so a logged performance can be re-rendered later.
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { collectionPageNode } from '$lib/seo';
  import { wetyu, type ChannelView } from '$lib/wetyu/engine.svelte';
  import { actionFor, midiFor, BLACK_KEYS, PADS, TAP_MS, WHITE_KEYS, type Action } from '$lib/wetyu/keys';
  import { FX } from '$lib/wetyu/protocol';
  import { VISUALS, type Frame, type Visual } from '$lib/wetyu/visuals';

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];

  /** Codes currently lit on screen (keyboard or pointer). */
  let lit = $state<Record<string, boolean>>({});
  /** Physical keys down, to dedupe keydown and to release on blur. */
  const down = new Map<string, Action>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- never rendered; keeps the key path free of reactive bookkeeping
  /** Midi note sent for a held key, so an octave change mid-hold still releases it. */
  const sounding = new Map<string, number>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- same: bookkeeping only
  /**
   * Loop gating. A loop is heard while latched OR while any input holds it.
   * A tap (shorter than TAP_MS) flips the latch; a longer press is momentary
   * and puts the latch back how it was. The engine only ever sees on/off.
   */
  const latched: [boolean, boolean, boolean] = [false, false, false];
  const holds: [number, number, number] = [0, 0, 0];
  /** When each hold began, per key code, to tell a tap from a hold. */
  const pressedAt = new Map<string, number>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- bookkeeping only
  /** A chord (Backspace) consumed this hold: its release must not toggle the latch. */
  const consumed = new Set<string>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- bookkeeping only
  /** Pointer presses live in their own key space so they never release a physical key. */
  const POINTER = 'ptr:';
  const keyOf = (code: string) => (code.startsWith(POINTER) ? code.slice(POINTER.length) : code);

  let help = $state<HTMLDialogElement | null>(null);
  let canvas = $state<HTMLCanvasElement | null>(null);
  let visualIndex = $state(0);
  let visual: Visual = VISUALS[0]?.() ?? { id: 'none', draw: () => undefined };
  let raf = 0;

  function gate(ch: 0 | 1 | 2): void {
    const on = latched[ch] || holds[ch] > 0;
    if (on !== wetyu.channels[ch]?.held) wetyu.hold(ch, on);
  }

  function press(code: string, action: Action): void {
    switch (action.kind) {
      case 'hold':
        holds[action.ch]++;
        pressedAt.set(code, performance.now());
        gate(action.ch);
        break;
      case 'note': {
        const midi = midiFor(action.semitone, wetyu.octave);
        wetyu.note(midi, true);
        sounding.set(code, midi);
        break;
      }
      case 'drum':
        wetyu.drum(action.pad);
        break;
      case 'record':
        wetyu.record(action.ch);
        break;
      case 'fx':
        wetyu.fx(action.ch, !wetyu.channels[action.ch]?.fxOn);
        break;
      case 'save':
        void saveTake();
        break;
      case 'transport':
        wetyu.toggleTransport();
        break;
      case 'tempo':
        wetyu.setTempo(wetyu.bpm + action.delta);
        break;
      case 'click':
        wetyu.setClick(!wetyu.click);
        break;
      case 'octave':
        wetyu.octave = Math.min(7, Math.max(1, wetyu.octave + action.delta));
        break;
    }
    lit[keyOf(code)] = true;
  }

  function release(code: string, action: Action): void {
    if (action.kind === 'hold') {
      holds[action.ch] = Math.max(0, holds[action.ch] - 1);
      const tap = performance.now() - (pressedAt.get(code) ?? 0) < TAP_MS;
      pressedAt.delete(code);
      if (tap && !consumed.delete(code)) latched[action.ch] = !latched[action.ch];
      gate(action.ch);
    }
    if (action.kind === 'note') {
      const midi = sounding.get(code);
      if (midi !== undefined) wetyu.note(midi, false);
      sounding.delete(code);
    }
    lit[keyOf(code)] = false;
  }

  /** Backspace while holding a loop: clear it (and drop its latch). */
  function clearHeld(): boolean {
    let any = false;
    for (const [code, a] of down) {
      if (a.kind !== 'hold') continue;
      any = true;
      consumed.add(code);
      latched[a.ch] = false;
      wetyu.clear(a.ch);
    }
    return any;
  }

  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    );
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.repeat || e.ctrlKey || isTyping(e.target) || help?.open) return;
    // A focused button owns Space and Enter; don't double up with the transport.
    if ((e.code === 'Space' || e.code === 'Enter') && e.target instanceof HTMLButtonElement) return;
    if (e.code === 'Backspace' && clearHeld()) {
      e.preventDefault();
      return;
    }
    const action = actionFor(e.code, { shift: e.shiftKey, alt: e.altKey, meta: e.metaKey });
    if (!action) return;
    e.preventDefault();
    if (down.has(e.code)) return;
    down.set(e.code, action);
    void wetyu.resume();
    press(e.code, action);
  }

  function onKeyUp(e: KeyboardEvent): void {
    const action = down.get(e.code);
    if (!action) return;
    down.delete(e.code);
    release(e.code, action);
  }

  function releaseAll(): void {
    for (const [code, action] of down) release(code, action);
    down.clear();
    sounding.clear();
    pressedAt.clear();
    consumed.clear();
    holds.fill(0);
    latched.fill(false);
    lit = {};
    wetyu.panic();
  }

  /** Pointer press-and-hold for the on-screen keys, pads and hold buttons. */
  function pointer(key: string, action: Action) {
    const code = POINTER + key;
    let held = false;
    const up = () => {
      if (!held) return;
      held = false;
      release(code, action);
    };
    return {
      onpointerdown: (e: PointerEvent) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        void wetyu.resume();
        held = true;
        press(code, action);
      },
      onpointerup: up,
      onpointercancel: up,
    };
  }

  function stateLabel(c: ChannelView): string {
    switch (c.state) {
      case 'empty':
        return 'empty';
      case 'recording':
        return c.pos < 0 ? 'waiting for the bar' : `recording bar ${String(Math.floor(c.pos) + 1)}`;
      case 'until':
        return 'finishing the bar';
      case 'looping':
        return `${String(c.bars)} bar${c.bars === 1 ? '' : 's'}`;
      case 'overdub':
        return `overdubbing ${String(c.bars)} bar${c.bars === 1 ? '' : 's'}`;
    }
  }

  function recLabel(c: ChannelView): string {
    if (c.state === 'recording' || c.state === 'until') return 'stop';
    if (c.state === 'overdub') return 'stop dub';
    if (c.state === 'looping') return 'overdub';
    return 'rec';
  }

  /** 0..1 around the ring: loop position, or bars-elapsed fraction while recording. */
  function ring(c: ChannelView): number {
    if (c.state === 'looping' || c.state === 'overdub') return c.pos;
    if (c.pos <= 0) return 0;
    return c.pos - Math.floor(c.pos);
  }

  // ---- picture ----------------------------------------------------------

  function frame(): Frame | null {
    if (!canvas) return null;
    return {
      t: wetyu.t,
      sampleRate: wetyu.sampleRate,
      bar: wetyu.bar,
      bpm: wetyu.bpm,
      playing: wetyu.playing,
      channels: wetyu.channels,
      width: canvas.width,
      height: canvas.height,
    };
  }

  function paint(): void {
    const ctx = canvas?.getContext('2d');
    const f = frame();
    if (ctx && f) visual.draw(ctx, f);
  }

  function resize(): void {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    paint();
  }

  function loop(): void {
    raf = 0;
    paint();
    if (wetyu.playing) raf = requestAnimationFrame(loop);
  }

  $effect(() => {
    if (wetyu.playing && !raf) raf = requestAnimationFrame(loop);
  });

  function pickVisual(i: number): void {
    const make = VISUALS[i];
    if (!make) return;
    visualIndex = i;
    visual = make();
    paint();
  }

  async function saveTake(): Promise<void> {
    const log = await wetyu.takeLog();
    const blob = new Blob([JSON.stringify(log)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wetyu-take-${String(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  onMount(() => {
    void wetyu.boot();
    resize();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', releaseAll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', releaseAll);
      wetyu.destroy();
    };
  });
</script>

<SeoHead
  title="wetyu"
  description="a three-channel looper — mic, keys, drums. loops run forever; hold a key to hear one."
  canonical="/wetyu"
  schema={collectionPageNode({ path: '/wetyu', name: 'wetyu — threesam' })}
/>

<main class="wetyu" class:playing={wetyu.playing}>
  <!-- data-static: the idle frame is deterministic (nothing moves until the
       transport runs), so the visual suite can screenshot it unmasked. -->
  <canvas bind:this={canvas} class="layers" aria-hidden="true" data-static></canvas>

  <header class="top">
    <h1>wetyu</h1>
    <p class="lede">three loops, always running.</p>
  </header>

  {#if wetyu.error}
    <p class="error" role="alert">{wetyu.error}</p>
  {/if}

  <section class="transport" aria-label="transport">
    <button
      type="button"
      class="play"
      class:on={wetyu.playing}
      aria-pressed={wetyu.playing}
      onclick={() => {
        void wetyu.resume();
        wetyu.toggleTransport();
      }}
    >
      {wetyu.playing ? 'stop' : 'play'} <kbd>space</kbd>
    </button>
    <span class="bar">bar {Math.floor(wetyu.t / wetyu.bar) + 1}</span>
    <label class="bpm">
      <span>bpm</span>
      <input
        type="number"
        min="40"
        max="240"
        value={wetyu.bpm}
        disabled={wetyu.locked}
        aria-label="tempo"
        oninput={(e) => {
          wetyu.setTempo(Number(e.currentTarget.value));
        }}
      />
      {#if wetyu.locked}<small>clear the loops to change tempo</small>{/if}
    </label>
    <label class="toggle">
      <input
        type="checkbox"
        checked={wetyu.click}
        onchange={(e) => {
          wetyu.setClick(e.currentTarget.checked);
        }}
      />
      click <kbd>L</kbd>
    </label>
    <div class="latency">
      <label class="toggle">
        <input
          type="checkbox"
          checked={wetyu.tight}
          onchange={(e) => {
            const want = e.currentTarget.checked;
            e.currentTarget.checked = wetyu.tight; // the engine decides, after its confirm
            void wetyu.setTight(want);
          }}
        />
        tight
      </label>
      <span class="readout">{wetyu.ready ? `${String(wetyu.latencyMs)} ms out` : 'loading engine…'}</span>
    </div>
  </section>

  <section class="channels" aria-label="loops">
    {#each wetyu.channels as c, i (c.name)}
      <article class="channel" data-state={c.state}>
        <h2 class="name">{c.name}</h2>
        <button
          type="button"
          class="hold"
          class:lit={c.held}
          class:fx={c.fxWet > 0.5}
          aria-label="{i + 1} {stateLabel(c)} — {c.name} loop, tap to latch, hold to hear"
          aria-pressed={c.held}
          style:--ring={String(ring(c))}
          style:--gate={String(c.gate)}
          {...pointer(`Digit${String(i + 1)}`, { kind: 'hold', ch: i as 0 | 1 | 2 })}
        >
          <kbd>{i + 1}</kbd>
          <span class="state" aria-live="polite">{stateLabel(c)}</span>
        </button>
        <div class="row">
          <button
            type="button"
            class="rec"
            class:on={c.state === 'recording' || c.state === 'overdub'}
            aria-label="{recLabel(c)} ⇧{i + 1} — record {c.name}"
            onclick={() => {
              void wetyu.resume();
              wetyu.record(i);
            }}
          >
            {recLabel(c)} <kbd>⇧{i + 1}</kbd>
          </button>
          <button
            type="button"
            class="fx-toggle"
            class:on={c.fxOn}
            aria-pressed={c.fxOn}
            aria-label="fx ⌥{i + 1} — {FX[c.fx]} on {c.name}"
            onclick={() => {
              wetyu.fx(i, !c.fxOn);
            }}
          >
            fx <kbd>⌥{i + 1}</kbd>
          </button>
          <button
            type="button"
            class="clear"
            aria-label="clear {i + 1}+⌫ — clear {c.name}"
            disabled={c.state === 'empty'}
            onclick={() => {
              latched[i] = false;
              wetyu.clear(i);
              gate(i as 0 | 1 | 2);
            }}
          >
            clear <kbd>{i + 1}+⌫</kbd>
          </button>
          <select
            class="fx-pick"
            aria-label="{c.name} effect"
            value={c.fx}
            onchange={(e) => {
              wetyu.selectFx(i, Number(e.currentTarget.value));
            }}
          >
            {#each FX as id, j (id)}
              <option value={j}>{id}</option>
            {/each}
          </select>
        </div>
        {#if i === 0}
          <div class="mic">
            {#if wetyu.mic === 'on'}
              <label class="toggle">
                <input
                  type="checkbox"
                  checked={wetyu.micMonitor}
                  onchange={(e) => {
                    wetyu.setMicMonitor(e.currentTarget.checked);
                  }}
                />
                monitor
              </label>
              <label class="offset">
                offset {wetyu.micOffsetMs} ms
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wetyu.micOffsetMs}
                  aria-label="mic offset"
                  oninput={(e) => {
                    wetyu.setMicOffsetMs(Number(e.currentTarget.value));
                  }}
                />
              </label>
            {:else}
              <button
                type="button"
                class="enable"
                disabled={wetyu.mic === 'pending'}
                onclick={() => {
                  void wetyu.resume();
                  void wetyu.enableMic();
                }}
              >
                {wetyu.mic === 'denied' ? 'mic blocked — retry' : 'enable mic'}
              </button>
            {/if}
          </div>
        {/if}
      </article>
    {/each}
  </section>

  <section class="instruments">
    <div class="piano" role="group" aria-label="keys">
      {#each WHITE_KEYS as [code, semitone, label] (code)}
        <button
          type="button"
          class="white"
          class:lit={lit[code]}
          aria-label="{label} {NOTE_NAMES[semitone]}"
          {...pointer(code, { kind: 'note', semitone })}
        >
          {label}
        </button>
      {/each}
      {#each BLACK_KEYS as [code, semitone, label, after] (code)}
        <button
          type="button"
          class="black"
          class:lit={lit[code]}
          style:--after={String(after)}
          aria-label="{label} {NOTE_NAMES[semitone]}"
          {...pointer(code, { kind: 'note', semitone })}
        >
          {label}
        </button>
      {/each}
    </div>
    <div class="octave">
      <button
        type="button"
        aria-label="octave down"
        onclick={() => {
          press('BracketLeft', { kind: 'octave', delta: -1 });
          lit['BracketLeft'] = false;
        }}>[</button
      >
      <span>octave {wetyu.octave}</span>
      <button
        type="button"
        aria-label="octave up"
        onclick={() => {
          press('BracketRight', { kind: 'octave', delta: 1 });
          lit['BracketRight'] = false;
        }}>]</button
      >
    </div>
    <div class="pads" role="group" aria-label="drums">
      {#each PADS as [code, key, name], pad (code)}
        <button
          type="button"
          class="pad"
          class:lit={lit[code]}
          {...pointer(code, { kind: 'drum', pad })}
        >
          <kbd>{key}</kbd>
          <small>{name}</small>
        </button>
      {/each}
    </div>
  </section>

  <button type="button" class="info" aria-label="instructions" onclick={() => help?.showModal()}>
    i
  </button>

  <dialog bind:this={help} class="help" aria-label="instructions">
    <h2>how to play</h2>
    <p class="how">
      a little song in six presses: <kbd>⇧3</kbd> play drums <kbd>3</kbd> · <kbd>⇧2</kbd> play bass
      <kbd>2</kbd> · <kbd>⇧1</kbd> sing <kbd>1</kbd> · it loops. <kbd>⇧3</kbd> again layers more drums.
    </p>
    <table>
      <tbody>
        <tr><th><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> tap</th><td>loop on / off. mic, keys, drums.</td></tr>
        <tr><th><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> hold</th><td>hear it only while held, then back how it was.</td></tr>
        <tr>
          <th><kbd>⇧</kbd>+<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></th>
          <td>
            record. empty: start — the very first take counts two clicks first. recording: stop, and it loops
            right away (the first loop sets the bar; later ones snap to it). playing: overdub on top from the next
            bar. tapping the loop key while recording also stops it.
          </td>
        </tr>
        <tr><th><kbd>⌥</kbd>+<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></th><td>that loop's effect on / off. pick the effect per loop above.</td></tr>
        <tr><th>hold <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> + <kbd>⌫</kbd></th><td>clear that loop.</td></tr>
        <tr><th><kbd>A</kbd>…<kbd>K</kbd> <kbd>W E T Y U</kbd></th><td>bass. <kbd>[</kbd> <kbd>]</kbd> octave.</td></tr>
        <tr><th><kbd>Z</kbd>…<kbd>/</kbd></th><td>drums: kick, tight kick, clap, snare, snap, open hat, hat, rim, clav, cymbal.</td></tr>
        <tr><th><kbd>space</kbd></th><td>stop and start everything. loops stay.</td></tr>
        <tr><th><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></th><td>tempo ±1 / ±5, until the first loop sets it.</td></tr>
        <tr><th><kbd>L</kbd></th><td>click on / off.</td></tr>
        <tr><th><kbd>⌘S</kbd></th><td>save the take.</td></tr>
      </tbody>
    </table>
    <div class="help-row">
      {#if VISUALS.length > 1}
        <label>
          picture
          <select
            aria-label="visual"
            value={visualIndex}
            onchange={(e) => {
              pickVisual(Number(e.currentTarget.value));
            }}
          >
            {#each VISUALS as make, i (i)}
              <option value={i}>{make().id}</option>
            {/each}
          </select>
        </label>
      {/if}
      <button type="button" class="save" onclick={() => void saveTake()}>save take</button>
      <button type="button" class="close" onclick={() => help?.close()}>close <kbd>esc</kbd></button>
    </div>
  </dialog>
</main>

<style>
  .wetyu {
    --ink: var(--white);
    --dim: rgb(245 244 240 / 0.55);
    --line: rgb(245 244 240 / 0.16);
    --paper: #0c0c0a;
    position: relative;
    min-height: 100dvh;
    padding: clamp(1rem, 4vw, 3rem);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-mono);
    font-variation-settings: 'MONO' 1;
    display: grid;
    gap: 2rem;
    align-content: start;
  }

  /* The picture: fixed behind everything, the default view while playing. */
  .layers {
    position: fixed;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .top,
  .error,
  .transport,
  .channels,
  .instruments {
    position: relative;
    z-index: 1;
  }
  /* Controls recede while playing so the layers read; they come back on hover. */
  .playing .transport,
  .playing .channels,
  .playing .instruments,
  .playing .top {
    opacity: 0.55;
    transition: opacity 400ms ease;
  }
  .playing .transport:hover,
  .playing .channels:hover,
  .playing .instruments:hover {
    opacity: 1;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 5vw, 3rem);
    letter-spacing: var(--tracking-hero);
    text-transform: lowercase;
  }
  .lede {
    margin: 0.5rem 0 0;
    color: var(--dim);
  }

  kbd {
    display: inline-block;
    min-width: 1.4em;
    padding: 0 0.35em;
    border: 1px solid var(--line);
    border-radius: 3px;
    font: inherit;
    font-size: 0.75em;
    line-height: 1.6;
    text-align: center;
    text-transform: lowercase;
  }

  .error {
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--ink);
  }

  button,
  select {
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  select {
    padding: 0.35rem 0.5rem;
  }
  select option {
    background: var(--paper);
  }

  .transport {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--line);
  }
  .play {
    padding: 0.5rem 1rem;
  }
  .play.on {
    border-color: var(--ink);
  }
  .bar {
    color: var(--dim);
    min-width: 5ch;
  }
  .bpm {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .bpm input {
    width: 4.5rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: transparent;
    color: var(--ink);
    font: inherit;
  }
  .bpm small {
    color: var(--dim);
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }
  .toggle input,
  .offset input {
    accent-color: var(--ink);
  }
  .latency {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
  }
  .readout {
    color: var(--dim);
    font-size: 0.85rem;
  }

  .channels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
  }
  .channel {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--line);
    border-radius: 6px;
  }
  .name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 400;
    letter-spacing: var(--tracking-label);
  }
  .hold {
    position: relative;
    display: grid;
    place-items: center;
    gap: 0.25rem;
    aspect-ratio: 1;
    max-width: 12rem;
    width: 100%;
    justify-self: center;
    border-radius: 50%;
    /* Playhead: the ring sweeps with the loop; gate fills the disc as you hold. */
    background:
      radial-gradient(circle, rgb(245 244 240 / calc(var(--gate) * 0.25)) 0 60%, transparent 61%),
      conic-gradient(var(--ink) calc(var(--ring) * 360deg), var(--line) 0);
    -webkit-mask: radial-gradient(circle, #000 0 62%, transparent 63%, #000 64%);
    mask: radial-gradient(circle, #000 0 62%, transparent 63%, #000 64%);
  }
  .hold.fx {
    outline: 1px dashed var(--ink);
    outline-offset: 4px;
  }
  /* The mask clips an outline; a focus ring has to live inside the disc. */
  .hold:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 3px var(--ink);
  }
  .hold kbd {
    font-size: 1.6rem;
    border-color: transparent;
  }
  .hold .state {
    font-size: 0.7rem;
    color: var(--dim);
    text-align: center;
    max-width: 8rem;
  }
  .channel[data-state='recording'] .hold .state,
  .channel[data-state='until'] .hold .state {
    color: var(--ink);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .rec,
  .clear,
  .fx-toggle,
  .enable {
    padding: 0.4rem 0.75rem;
  }
  .rec.on,
  .fx-toggle.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .fx-pick {
    margin-left: auto;
  }
  .mic {
    display: grid;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .offset {
    display: grid;
    gap: 0.25rem;
    color: var(--dim);
  }

  .instruments {
    display: grid;
    gap: 1rem;
  }
  .piano {
    --w: clamp(2.2rem, 7vw, 4rem);
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, var(--w));
    height: calc(var(--w) * 3);
  }
  .white {
    border-radius: 0 0 4px 4px;
    align-self: stretch;
    padding-top: calc(var(--w) * 2);
  }
  .black {
    position: absolute;
    top: 0;
    left: calc((var(--after) + 1) * var(--w) - var(--w) * 0.35);
    width: max(24px, calc(var(--w) * 0.7));
    height: 60%;
    background: var(--paper);
    border-color: var(--ink);
    z-index: 1;
    padding-top: calc(var(--w) * 1.1);
  }
  .white.lit,
  .black.lit,
  .pad.lit {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .octave {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--dim);
  }
  .octave button {
    width: 2rem;
    height: 2rem;
  }
  .pads {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(4.5rem, 6rem));
    gap: 0.5rem;
  }
  .pad {
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    aspect-ratio: 1;
    place-content: center;
  }
  .pad kbd {
    font-size: 1rem;
    border-color: transparent;
  }
  .pad small {
    color: var(--dim);
  }
  .pad.lit small {
    color: inherit;
  }

  .info {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 2;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border-color: var(--dim);
    background: var(--paper);
    font-style: italic;
    font-size: 1.1rem;
  }
  .help {
    max-width: 36rem;
    padding: 1.5rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-mono);
    font-variation-settings: 'MONO' 1;
    font-size: 0.9rem;
  }
  .help::backdrop {
    background: rgb(12 12 10 / 0.7);
  }
  .help h2 {
    margin: 0 0 1rem;
    font-size: 1rem;
    letter-spacing: var(--tracking-label);
  }
  .how {
    margin: 0 0 1rem;
    color: var(--dim);
  }
  .help table {
    border-collapse: collapse;
    color: var(--dim);
  }
  .help th {
    padding: 0.35rem 0.75rem 0.35rem 0;
    text-align: left;
    font-weight: 400;
    white-space: nowrap;
    vertical-align: top;
    color: var(--ink);
  }
  .help td {
    padding: 0.35rem 0;
    vertical-align: top;
  }
  .help tr + tr th,
  .help tr + tr td {
    border-top: 1px solid var(--line);
  }
  .help-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }
  .help-row label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--dim);
  }
  .help-row .close {
    margin-left: auto;
  }
  .help button {
    padding: 0.4rem 0.75rem;
  }
</style>
