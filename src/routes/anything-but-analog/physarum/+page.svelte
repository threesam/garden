<script lang="ts">
  // Physarum field. Everything expensive happens in a worker: the main thread
  // hands over the canvas once and then does nothing per frame, which is where
  // the actual performance claim lives. Wasm on the main thread would still
  // block; OffscreenCanvas plus a worker is what takes the cost to zero.
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { collectionPageNode } from '$lib/seo';
  import PhysarumWorker from '$lib/art/physarum-worker?worker';
  import type { InboundMessage } from '$lib/art/physarum-worker';

  /** 150k lands on 60fps at a 512 grid; measured, see the Rust module. */
  const AGENTS = 150_000;

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let fps = $state(0);
  let status = $state('booting');

  // Composed here rather than in markup: Svelte trims the whitespace at the
  // start of an {#if} block, so an inline separator renders as "running· 59".
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

    const worker: Worker = new PhysarumWorker();
    worker.onmessage = (e: MessageEvent<{ type: string; fps?: number; message?: string }>) => {
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
      agents: AGENTS,
      seed: 12345,
      wasmUrl: '/wasm/garden_math.wasm',
    };
    worker.postMessage(start, [offscreen]);

    const onVisibility = (): void => {
      worker.postMessage({ type: document.hidden ? 'pause' : 'resume' });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      worker.terminate();
    };
  });
</script>

<SeoHead
  title="physarum — anything but analog"
  description="A slime mould transport network, simulated in Rust and rendered off the main thread."
  ogImage="/og/anything-but-analog.png"
  canonical="/anything-but-analog/physarum"
  schema={collectionPageNode({
    path: '/anything-but-analog/physarum',
    name: 'physarum — threesam',
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
      <header class="flex flex-col gap-2">
        <h1 class="font-display text-2xl lowercase sm:text-3xl">physarum</h1>
        <p class="font-mono text-xs text-white/50">
          {AGENTS.toLocaleString()} agents, each sensing three points ahead on a
          shared trail map and turning toward the strongest. Nothing tells them to
          build a network.
        </p>
      </header>

  <!--
    Kept honest deliberately. The pattern above is real; the mechanism is not,
    and claiming otherwise would be the easy lie about a thing that already
    looks convincing.
  -->
      <section class="flex flex-col gap-8 border-t border-white/10 pt-6">
        <div class="flex flex-col gap-2">
          <h2 class="font-display text-sm lowercase">the organism</h2>
          <p class="text-sm leading-relaxed text-white/60">
        <em>Physarum polycephalum</em> is a slime mould — an amoebozoan protist. Not
        a fungus, despite the name and the damp-log habitat: no hyphae, no fruiting
        body, no relation to the mushrooms next door.
      </p>
          <p class="text-sm leading-relaxed text-white/60">
        In its plasmodial stage it is a <strong>single cell</strong>. One
        multinucleate bag of cytoplasm, millions of nuclei sharing a continuous
        interior with no membranes between them, spreading across a log at a scale
        you can see unaided. It hunts bacteria and spores by growing a network of
        tubes toward food and abandoning the routes that stop paying.
      </p>
          <p class="text-sm leading-relaxed text-white/60">
        Transport runs on <strong>shuttle streaming</strong>. Calcium-driven
        actomyosin contractions squeeze the tube walls in rhythm, sloshing
        cytoplasm back and forth at up to a millimetre a second and reversing
        direction roughly every two minutes. Net flow is the asymmetry in that
        oscillation. Tubes carrying flux thicken; tubes that go quiet are resorbed.
        That feedback is why it can find the shortest path through a maze, and why
        it reproduced the Tokyo rail network when researchers laid oat flakes out
        in the shape of the surrounding towns.
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <h2 class="font-display text-sm lowercase">what this simulation is</h2>
          <p class="text-sm leading-relaxed text-white/60">
        The Jones (2010) agent model. Each of the {AGENTS.toLocaleString()} particles
        samples the trail map at three points ahead — left, centre, right — steers
        toward the strongest, steps forward and deposits. The map blurs and decays.
        Nothing in that loop mentions networks; the branching falls out of it.
      </p>
          <p class="text-sm leading-relaxed text-white/60">
        It reproduces the <em>phenomenon</em> and not the <em>mechanism</em>. Jones
        calls his particles a hypothetical population, and that word is doing real
        work: the agents correspond to nothing in the organism. Physarum is one
        cell, so there is no population to discretise — the particles stand in for
        cytoplasm, not for individuals.
      </p>
          <p class="text-sm leading-relaxed text-white/60">
        Three things are missing that matter. There is <strong>no oscillation</strong>:
        these agents crawl steadily forward and never reverse, so the shuttle
        streaming that actually moves material is absent. There is
        <strong>no food</strong>, so the network has nothing to optimise toward and
        wanders a featureless void — the maze and rail-network results depend
        entirely on attractors this simulation does not have. And the tubes have
        <strong>no thickness</strong>; brightness here is trail concentration, not
        the vein diameter that real reinforcement acts on.
      </p>
          <p class="text-sm leading-relaxed text-white/60">
        So: a decent portrait of what physarum <em>does</em>, and no account at all
        of how it does it.
          </p>
        </div>
      </section>
    </div>
  </div>
</main>
