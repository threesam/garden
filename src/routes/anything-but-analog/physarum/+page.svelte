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
    dicty: { label: 'dictyostelium', agents: 250_000 },
  } as const satisfies Record<SimName, { label: string; agents: number }>;

  let sim = $state<SimName>('physarum');
  /** Fresh each load, so the same page is never the same run twice. */
  const seed = Math.floor(Math.random() * 0xffff) + 1;
  let food = $state(0);
  const agents = $derived(SIMS[sim].agents);

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let worker: Worker | null = null;
  let fps = $state(0);
  let vitality = $state(1);
  let foodLeft = $state(0);
  let status = $state('booting');

  // Composed here rather than in markup: Svelte trims the whitespace at the
  // start of an {#if} block, so an inline separator renders as "running· 59".
  function pick(next: SimName): void {
    if (next === sim) return;
    sim = next;
    fps = 0;
    // The worker keeps the canvas; only the simulation behind it swaps.
    food = 0;
    worker?.postMessage({ type: 'switch', sim: next, agents: SIMS[next].agents, seed });
  }

  /** Canvas is 512 internally and CSS-scaled, so clicks need mapping back. */
  function drop(event: PointerEvent): void {
    if (sim !== 'physarum' || !canvasEl) return;
    const r = canvasEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = ((event.clientX - r.left) / r.width) * 512;
    const y = ((event.clientY - r.top) / r.height) * 512;
    worker?.postMessage({ type: 'food', x, y });
    food += 1;
  }

  /** Keyboard-reachable equivalent of clicking — a canvas cannot be tabbed into. */
  function scatter(): void {
    if (sim !== 'physarum') return;
    for (let i = 0; i < 5; i++) {
      worker?.postMessage({
        type: 'food',
        x: 60 + Math.random() * 392,
        y: 60 + Math.random() * 392,
      });
      food += 1;
    }
  }

  function clearFood(): void {
    worker?.postMessage({ type: 'clearFood' });
    food = 0;
  }

  function describe(v: number): string {
    if (v > 0.75) return 'thriving';
    if (v > 0.4) return 'feeding';
    if (v > 0.1) return 'hungry';
    return 'starving';
  }
  const condition = $derived(describe(vitality));

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
    w.onmessage = (
      e: MessageEvent<{
        type: string;
        fps?: number;
        message?: string;
        vitality?: number;
        foodLeft?: number;
      }>,
    ) => {
      if (e.data.type === 'fps') {
        fps = e.data.fps ?? 0;
        vitality = e.data.vitality ?? 1;
        foodLeft = e.data.foodLeft ?? 0;
      }
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
      seed,
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
        onpointerdown={drop}
        class="aspect-square w-full max-w-[min(82vh,900px)]"
        class:feedable={sim === 'physarum'}
      ></canvas>
      {#if sim === 'physarum'}
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span class="font-mono text-xs" class:starving={vitality < 0.25}>
            {#if food === 0}
              click the plate to feed it
            {:else}
              {Math.round(foodLeft * 100)}% food left · {condition}
            {/if}
          </span>
          <button
            type="button"
            onclick={scatter}
            class="rounded-sm border px-3 py-1 font-mono text-xs lowercase"
          >
            scatter
          </button>
          {#if food > 0}
            <button
              type="button"
              onclick={clearFood}
              class="rounded-sm border px-3 py-1 font-mono text-xs lowercase"
            >
              clear
            </button>
          {/if}
        </div>
      {/if}
      <p class="mt-2 font-mono text-xs text-white/40">
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
            {agents.toLocaleString()} agents, each sampling the trail map at three
            points ahead and turning toward the strongest. nothing tells them to
            build a network.
          {:else}
            {agents.toLocaleString()} amoebae relaying pulses of cyclic AMP. a cell
            that hears one fires its own, then goes deaf while it recovers. nothing
            tells them to make waves.
          {/if}
        </p>
      </header>

      <section class="flex flex-col gap-8 border-t border-white/10 pt-6">
        {#if sim === 'physarum'}
          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">the organism</h2>
            <p class="text-sm leading-relaxed text-white/60">
              <em>physarum polycephalum</em> is a slime mould. not a fungus — no
              hyphae, no fruiting body, no relation to the mushrooms next door.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              in its plasmodial stage it is one cell. millions of nuclei sharing a
              single interior with no walls between them, spread across a log at a
              size you can see without a microscope.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              it eats by growing tubes toward food and abandoning the ones that
              stop paying.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              the tubes move by shuttle streaming. calcium-driven contractions
              squeeze the walls in rhythm and slosh the cytoplasm back and forth at
              up to a millimetre a second, reversing direction about every two
              minutes. tubes carrying traffic thicken. tubes that go quiet get
              resorbed.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              that is how it solves mazes. and how it laid out the Tokyo rail
              network when researchers put oat flakes where the towns are.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">what this is</h2>
            <p class="text-sm leading-relaxed text-white/60">
              agents. each one samples the trail map at three points ahead, turns
              toward the strongest, steps, and leaves a deposit behind it. the map
              blurs and fades. nothing in that loop mentions networks.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              it gets the pattern right and the mechanism wrong.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              physarum is one cell, so there is no population to split into agents.
              these particles stand in for cytoplasm.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              nothing here oscillates. they crawl forward and never reverse, so the
              streaming that actually moves material is missing.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              and the tubes have no thickness. brightness is trail concentration,
              not the veins that real reinforcement acts on.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              the food is real though. drop some on the plate and it emits, the
              agents smell it, and the routes between sources get walked often
              enough to stay lit while everything else fades. nobody computes the
              route. it is just the paths that keep earning traffic.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              and it gets eaten. a flake shrinks as the network sits on it, calls
              more weakly as it empties, and goes quiet when it is gone. feed it
              and it thickens. stop, and upkeep outruns what it can find — the
              trails stop being reinforced, decay wins, and it resorbs itself down
              to almost nothing.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              a decent picture of what physarum does. no account of how.
            </p>
          </div>
        {:else}
          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">the organism</h2>
            <p class="text-sm leading-relaxed text-white/60">
              <em>dictyostelium discoideum</em> is a cellular slime mould, and
              cellular is doing the work. physarum is one enormous cell. this is
              thousands of separate amoebae, each with its own membrane, living
              alone in the soil and eating bacteria.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              when the bacteria run out they start shouting.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              a starving cell releases a pulse of cyclic AMP. neighbours that hear
              it relay the pulse, then go deaf for a while as they recover. relay
              and deafness is all an excitable medium needs, and the plate fills
              with travelling waves — rings around the founding cells, spirals
              wherever a front gets broken.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              between pulses each cell crawls a little way up the gradient. every
              wave that passes ratchets it closer to the source.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              they stream inward and pile into a mound. the mound becomes a slug
              and crawls off. then it stands up, and the cells that make the stalk
              die to lift the rest high enough to leave.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-display text-sm lowercase">what this is</h2>
            <p class="text-sm leading-relaxed text-white/60">
              here an agent is a cell. dictyostelium really is a population of
              individuals signalling each other, so the relay rule is the
              mechanism, not a stand-in for it.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              the waves come out of that on their own. concentric rings from the
              founding cells, and a spiral wherever a front breaks and the loose
              end winds up.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              the gold is the amoebae. they stream into rivers that run toward
              whatever is calling them.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              streaming only works because of adaptation. a cell climbs the
              gradient while the signal is rising and ignores it while the wave
              recedes. without that a wave is symmetric — you walk toward the
              front, the front passes, the gradient flips, you walk back, and you
              have gone nowhere.
            </p>
            <p class="text-sm leading-relaxed text-white/60">
              what is abstracted: real cAMP relay runs on receptor binding,
              adenylyl cyclase and phosphodiesterase, each with its own kinetics.
              here it is a threshold, a pulse and a timer.
            </p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</main>

<style>
  .starving {
    color: #e8734a;
  }
  span.font-mono:not(.starving) {
    color: rgb(255 255 255 / 0.4);
  }
  .feedable {
    cursor: crosshair;
  }
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
