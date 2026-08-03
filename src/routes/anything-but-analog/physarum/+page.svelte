<script lang="ts">
  // Physarum field. Everything expensive happens in a worker: the main thread
  // hands over the canvas once and then does nothing per frame, which is where
  // the actual performance claim lives. Wasm on the main thread would still
  // block; OffscreenCanvas plus a worker is what takes the cost to zero.
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { collectionPageNode } from '$lib/seo';
  import PhysarumWorker from '$lib/art/physarum-worker?worker';
  import type { InboundMessage, SimName } from '$lib/art/physarum-worker';

  /** Counts measured per sim against a 16.7ms budget on a 512 grid. */
  const SIMS = {
    physarum: { label: 'physarum', agents: 150_000 },
    dicty: { label: 'dictyostelium', agents: 400_000 },
  } as const satisfies Record<SimName, { label: string; agents: number }>;

  let sim = $state<SimName>('physarum');
  const agents = $derived(SIMS[sim].agents);

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let worker: Worker | null = null;
  let fps = $state(0);
  let status = $state('booting');

  // Composed here rather than in markup: Svelte trims the whitespace at the
  // start of an {#if} block, so an inline separator renders as "running· 59".
  function pick(next: SimName): void {
    if (next === sim) return;
    sim = next;
    fps = 0;
    // The worker keeps the canvas; only the simulation behind it swaps.
    worker?.postMessage({ type: 'switch', sim: next, agents: SIMS[next].agents, seed: 12345 });
  }

  const statusLine = $derived(
    fps > 0 ? `${status} · ${String(fps)} fps in the worker · main thread idle` : status,
  );

  onMount(() => {
    const canvas = canvasEl;
    if (!canvas) return;

    if (!('transferControlToOffscreen' in canvas)) {
      status = 'this browser has no OffscreenCanvas';
      return;
    }

    const w: Worker = new PhysarumWorker();
    worker = w;
    w.onmessage = (e: MessageEvent<{ type: string; fps?: number; message?: string }>) => {
      if (e.data.type === 'fps') fps = e.data.fps ?? 0;
      else if (e.data.type === 'ready') status = 'running';
      else if (e.data.type === 'error') status = e.data.message ?? 'failed';
    };

    // Permanent: once transferred, this canvas can never yield a 2D context on
    // the main thread again. Which is why cleanup terminates the worker rather
    // than trying to hand the canvas back.
    const offscreen = canvas.transferControlToOffscreen();
    const start: InboundMessage = {
      type: 'start',
      canvas: offscreen,
      sim,
      agents,
      seed: 12345,
      wasmUrl: '/wasm/garden_math.wasm',
    };
    w.postMessage(start, [offscreen]);

    const onVisibility = (): void => {
      w.postMessage({ type: document.hidden ? 'pause' : 'resume' });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      worker = null;
      w.terminate();
    };
  });
</script>

<SeoHead
  title="slime moulds — anything but analog"
  description="Two slime moulds simulated in Rust and rendered off the main thread: a physarum transport network and dictyostelium cAMP waves."
  ogImage="/og/anything-but-analog.png"
  canonical="/anything-but-analog/physarum"
  schema={collectionPageNode({
    path: '/anything-but-analog/physarum',
    name: 'slime moulds — threesam',
  })}
/>

<!--
  Desktop is a fixed full-viewport split: the page itself never scrolls, and the
  writing column scrolls inside its own half while the simulation holds the
  other. Mobile keeps ordinary page flow — locking a phone to one viewport
  height and nesting a scroller inside it fights the browser's own gesture
  handling and hides most of the copy behind a scrollbar nobody expects.
-->
<main class="bg-black text-white lg:h-dvh lg:overflow-hidden">
  <div class="mx-auto grid max-w-[1700px] lg:h-full lg:grid-cols-2">
    <!-- Canvas first in DOM order on mobile, second on desktop. -->
    <div
      class="order-1 flex flex-col items-center justify-center px-4 pt-6 sm:px-8 lg:order-2 lg:h-full lg:py-8"
    >
      <canvas
        bind:this={canvasEl}
        class="aspect-square w-full max-w-[min(82vh,900px)]"
      ></canvas>
      <p class="mt-3 font-mono text-xs text-white/40">
        {statusLine}
      </p>
    </div>

    <div
      class="order-2 flex flex-col gap-6 px-4 py-8 sm:px-8 lg:order-1 lg:h-full lg:overflow-y-auto lg:py-10 lg:pr-10"
    >
      <header class="flex flex-col gap-3">
        <h1 class="font-display text-2xl lowercase sm:text-3xl">slime moulds</h1>

        <div class="flex flex-wrap gap-2">
          {#each Object.entries(SIMS) as [key, meta] (key)}
            <button
              type="button"
              class="rounded-sm border px-3 py-1 font-mono text-xs lowercase transition-colors"
              class:on={sim === key}
              onclick={() => { pick(key as SimName); }}
            >
              {meta.label}
            </button>
          {/each}
        </div>

        <p class="font-mono text-xs text-white/50">
          {#if sim === 'physarum'}
            {agents.toLocaleString()} agents, each sensing three points ahead on a
            shared trail map and turning toward the strongest. Nothing tells them
            to build a network.
          {:else}
            {agents.toLocaleString()} amoebae relaying pulses of cyclic AMP. A cell
            that hears one fires its own, then goes deaf while it recovers.
            Nothing tells them to make waves.
          {/if}
        </p>
      </header>

      <section class="flex flex-col gap-8 border-t border-white/10 pt-6">
        {#if sim === 'physarum'}
          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">the organism</h2>
            <p class="text-sm leading-relaxed text-white/60">
              <em>Physarum polycephalum</em> is a slime mould — an amoebozoan
              protist. Not a fungus, despite the name and the damp-log habitat:
              no hyphae, no fruiting body, no relation to the mushrooms next door.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              In its plasmodial stage it is a <strong>single cell</strong>. One
              multinucleate bag of cytoplasm, millions of nuclei sharing a
              continuous interior with no membranes between them, spreading across
              a log at a scale you can see unaided. It hunts by growing tubes
              toward food and abandoning the routes that stop paying.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              Transport runs on <strong>shuttle streaming</strong>. Calcium-driven
              actomyosin contractions squeeze the tube walls in rhythm, sloshing
              cytoplasm back and forth at up to a millimetre a second and reversing
              direction roughly every two minutes. Tubes carrying flux thicken;
              tubes that go quiet are resorbed. That feedback is why it can find
              the shortest path through a maze, and why it reproduced the Tokyo
              rail network when researchers laid oat flakes out in the shape of the
              surrounding towns.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">what this simulation is</h2>
            <p class="text-sm leading-relaxed text-white/60">
              The Jones (2010) agent model, and it reproduces the
              <em>phenomenon</em> rather than the <em>mechanism</em>. Jones calls
              his particles a hypothetical population, and the word is doing real
              work: the agents correspond to nothing in the organism. Physarum is
              one cell, so there is no population to discretise — the particles
              stand in for cytoplasm, not for individuals.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              Three things are missing that matter. There is
              <strong>no oscillation</strong>: these agents crawl forward and never
              reverse, so the shuttle streaming that actually moves material is
              absent. There is <strong>no food</strong>, so the network optimises
              toward nothing — the maze and rail-network results depend entirely on
              attractors this does not have. And the tubes have
              <strong>no thickness</strong>; brightness is trail concentration, not
              the vein diameter real reinforcement acts on.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              A decent portrait of what physarum does, and no account of how.
            </p>
          </div>
        {:else}
          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">the organism</h2>
            <p class="text-sm leading-relaxed text-white/60">
              <em>Dictyostelium discoideum</em> is a <strong>cellular</strong>
              slime mould, and that word carries the whole difference. Where
              physarum is one enormous cell, dictyostelium is thousands of separate
              amoebae, each with its own membrane and its own decisions, living
              independently in the soil and eating bacteria.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              When the bacteria run out they start shouting. A starving cell
              releases a pulse of <strong>cyclic AMP</strong>; neighbours that hear
              it relay the pulse onward and then go briefly deaf while they
              recover. Relay plus deafness is all an excitable medium needs, and
              the plate fills with travelling waves — concentric rings around
              founding cells, and rotating spirals where a wavefront gets broken.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              Between pulses each cell crawls a little way up the gradient, so
              every wave that passes ratchets it toward the source. They stream
              inward along the wavefronts, pile into a mound, and the mound becomes
              a migrating slug and then a stalked fruiting body — in which some
              cells die to lift the others high enough to disperse.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">what this simulation is</h2>
            <p class="text-sm leading-relaxed text-white/60">
              This is the one modelled <strong>honestly</strong>. Dictyostelium
              really is a population of individuals signalling neighbours, so here
              an agent is a cell, the relay rule is the actual mechanism, and the
              waves are on screen for the same reason they are on a real plate.
              Nothing stands in for anything.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              What you get are the <strong>target waves</strong> — concentric
              fronts expanding from founding cells, with the tissue brightening
              where amoebae clump. Spirals are not there yet: the simulation seeds
              a broken wavefront, which is the only way a spiral can start, but the
              free end does not survive long enough to wind up. Both patterns are
              real in culture, so this is a real behaviour rather than a stand-in
              for the missing one.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              Still abstracted: real cAMP relay runs through receptor binding,
              adenylyl cyclase and phosphodiesterase degradation, each with its own
              kinetics. Here it is a threshold, a pulse and a timer.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              An earlier attempt hit every measurement I set for it by drawing the
              spirals from a formula centred on fixed coordinates instead of
              growing them. It looked considerably better than this does. It was
              also a picture of the answer rather than the answer, which for the
              one organism here whose agents mean something would have been the
              worst possible trade.
            </p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</main>

<style>
  .on {
    background: #e8a317;
    border-color: #e8a317;
    color: #14140f;
    font-weight: 700;
  }
  button:not(.on) {
    border-color: rgb(255 255 255 / 0.18);
    color: rgb(255 255 255 / 0.55);
  }
  button:not(.on):hover {
    color: rgb(255 255 255 / 0.9);
  }
  button:focus-visible {
    outline: 2px solid #e8a317;
    outline-offset: 2px;
  }
</style>
