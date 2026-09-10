<script lang="ts">
  // wetyu — three loops, always running. Hold 1/2/3 to hear one.
  //
  // Feel rule: every key handler sends to the audio thread FIRST, then lights
  // the key. Nothing here waits on a render before the engine hears about it.
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import { collectionPageNode } from '$lib/seo';
  import { wetyu, type ChannelView } from '$lib/wetyu/engine.svelte';
  import { actionFor, midiFor, BLACK_KEYS, PADS, WHITE_KEYS, type Action } from '$lib/wetyu/keys';

  const LATENCY_MODES = [{ label: 'tight' }, { label: 'safe' }] as const;
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];

  /** Codes currently lit on screen (keyboard or pointer). */
  let lit = $state<Record<string, boolean>>({});
  /** Physical keys down, to dedupe keydown and to release on blur. */
  const down = new Map<string, Action>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- never rendered; keeps the key path free of reactive bookkeeping
  /** Midi note sent for a held key, so an octave change mid-hold still releases it. */
  const sounding = new Map<string, number>(); // eslint-disable-line svelte/prefer-svelte-reactivity -- same: bookkeeping only

  function press(code: string, action: Action): void {
    switch (action.kind) {
      case 'hold':
        wetyu.hold(action.ch, true);
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
        wetyu.record();
        break;
      case 'select':
        wetyu.selected = (wetyu.selected + 1) % wetyu.channels.length;
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
      case 'clear':
        wetyu.clear();
        break;
      case 'octave':
        wetyu.octave = Math.min(7, Math.max(1, wetyu.octave + action.delta));
        break;
    }
    lit[code] = true;
  }

  function release(code: string, action: Action): void {
    if (action.kind === 'hold') wetyu.hold(action.ch, false);
    if (action.kind === 'note') {
      const midi = sounding.get(code);
      if (midi !== undefined) wetyu.note(midi, false);
      sounding.delete(code);
    }
    lit[code] = false;
  }

  function isTyping(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    const action = actionFor(e.code);
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
    wetyu.panic();
  }

  /** Pointer press-and-hold for the on-screen keys, pads and hold buttons. */
  function pointer(code: string, action: Action) {
    return {
      onpointerdown: (e: PointerEvent) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        void wetyu.resume();
        press(code, action);
      },
      onpointerup: () => {
        release(code, action);
      },
      onpointercancel: () => {
        release(code, action);
      },
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
    }
  }

  /** 0..1 around the ring: loop position, or bars-elapsed fraction while recording. */
  function ring(c: ChannelView): number {
    if (c.state === 'looping') return c.pos;
    if (c.pos <= 0) return 0;
    return c.pos - Math.floor(c.pos);
  }

  onMount(() => {
    void wetyu.boot();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
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

<main class="wetyu">
  <header class="top">
    <h1>wetyu</h1>
    <p class="lede">three loops, always running. hold <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> to hear them.</p>
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
    <span class="bar">bar {Math.floor(wetyu.position) + 1}</span>
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
      <Segmented
        items={LATENCY_MODES}
        active={wetyu.tight ? 0 : 1}
        onselect={(i) => void wetyu.setTight(i === 0)}
        ariaLabel="latency mode"
      />
      <span class="readout">{wetyu.ready ? `${String(wetyu.latencyMs)} ms out` : 'loading engine…'}</span>
    </div>
  </section>

  <section class="channels" aria-label="loops">
    {#each wetyu.channels as c, i (c.name)}
      <article class="channel" class:selected={i === wetyu.selected} data-state={c.state}>
        <button
          type="button"
          class="name"
          onclick={() => {
            wetyu.selected = i;
          }}
        >
          {c.name}
          {#if i === wetyu.selected}<span class="sel">selected</span>{/if}
        </button>
        <button
          type="button"
          class="hold"
          class:lit={c.held}
          aria-label="hold {c.name}"
          aria-pressed={c.held}
          style:--ring={String(ring(c))}
          style:--gate={String(c.gate)}
          {...pointer(`Digit${String(i + 1)}`, { kind: 'hold', ch: i as 0 | 1 | 2 })}
        >
          <kbd>{i + 1}</kbd>
          <span class="state">{stateLabel(c)}</span>
        </button>
        <div class="row">
          <button
            type="button"
            class="rec"
            class:on={c.state === 'recording'}
            aria-label="record {c.name}"
            onclick={() => {
              void wetyu.resume();
              wetyu.record(i);
            }}
          >
            {c.state === 'recording' ? 'stop' : 'rec'} {#if i === wetyu.selected}<kbd>R</kbd>{/if}
          </button>
          <button
            type="button"
            class="clear"
            aria-label="clear {c.name}"
            disabled={c.state === 'empty'}
            onclick={() => {
              wetyu.clear(i);
            }}
          >
            clear
          </button>
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
          aria-label={NOTE_NAMES[semitone]}
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
          aria-label={NOTE_NAMES[semitone]}
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
          press('Comma', { kind: 'octave', delta: -1 });
          lit['Comma'] = false;
        }}>,</button
      >
      <span>octave {wetyu.octave}</span>
      <button
        type="button"
        aria-label="octave up"
        onclick={() => {
          press('Period', { kind: 'octave', delta: 1 });
          lit['Period'] = false;
        }}>.</button
      >
    </div>
    <div class="pads" role="group" aria-label="drums">
      {#each PADS as [code, key, name], pad (code)}
        <button
          type="button"
          class="pad"
          class:lit={lit[code]}
          aria-label={name}
          {...pointer(code, { kind: 'drum', pad })}
        >
          <kbd>{key}</kbd>
          <small>{name}</small>
        </button>
      {/each}
    </div>
  </section>

  <footer class="legend">
    <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> hold a loop</span>
    <span><kbd>R</kbd> record the selected loop</span>
    <span><kbd>tab</kbd> select the next loop</span>
    <span><kbd>⌫</kbd> clear it</span>
    <span><kbd>↑</kbd><kbd>↓</kbd> tempo ±1 <kbd>←</kbd><kbd>→</kbd> ±5</span>
    <span>press record in the first half of a bar and the loop starts at the bar line you're already in.</span>
  </footer>
</main>

<style>
  .wetyu {
    --ink: var(--white);
    --dim: rgb(245 244 240 / 0.55);
    --line: rgb(245 244 240 / 0.16);
    --accent: var(--coin);
    min-height: 100dvh;
    padding: clamp(1rem, 4vw, 3rem);
    background: #14140f;
    color: var(--ink);
    font-family: var(--font-mono);
    font-variation-settings: 'MONO' 1;
    display: grid;
    gap: 2rem;
    align-content: start;
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
    border: 1px solid var(--accent);
    color: var(--accent);
  }

  button {
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
    border-color: var(--accent);
    color: var(--accent);
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
  .toggle input {
    accent-color: var(--accent);
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
  .channel.selected {
    border-color: var(--accent);
  }
  .name {
    justify-self: start;
    border: 0;
    padding: 0;
    font-size: 1.1rem;
    letter-spacing: var(--tracking-label);
  }
  .sel {
    margin-left: 0.5rem;
    color: var(--accent);
    font-size: 0.7rem;
    letter-spacing: var(--tracking-meta);
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
      radial-gradient(circle, rgb(232 163 23 / calc(var(--gate) * 0.35)) 0 60%, transparent 61%),
      conic-gradient(var(--accent) calc(var(--ring) * 360deg), var(--line) 0);
    -webkit-mask: radial-gradient(circle, #000 0 62%, transparent 63%, #000 64%);
    mask: radial-gradient(circle, #000 0 62%, transparent 63%, #000 64%);
  }
  .hold kbd {
    font-size: 1.6rem;
    border-color: transparent;
  }
  .hold.lit kbd {
    color: var(--accent);
  }
  .hold .state {
    font-size: 0.7rem;
    color: var(--dim);
    text-align: center;
    max-width: 8rem;
  }
  .channel[data-state='recording'] .hold .state,
  .channel[data-state='until'] .hold .state {
    color: var(--accent);
  }
  .row {
    display: flex;
    gap: 0.5rem;
  }
  .rec,
  .clear,
  .enable {
    padding: 0.4rem 0.75rem;
  }
  .rec.on {
    border-color: #e5484d;
    color: #e5484d;
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
  .offset input {
    accent-color: var(--accent);
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
    left: calc((var(--after) + 1) * var(--w) - var(--w) * 0.3);
    width: calc(var(--w) * 0.6);
    height: 60%;
    background: #14140f;
    border-color: var(--ink);
    z-index: 1;
    padding-top: calc(var(--w) * 1.1);
  }
  .white.lit,
  .black.lit,
  .pad.lit {
    background: var(--accent);
    color: #14140f;
    border-color: var(--accent);
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

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    color: var(--dim);
    font-size: 0.8rem;
  }
  .legend kbd + kbd {
    margin-left: 0.15em;
  }
</style>
