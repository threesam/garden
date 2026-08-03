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

<main class="flex min-h-dvh flex-col gap-6 bg-black px-4 py-6 text-white sm:px-8">
  <header class="flex flex-col gap-1">
    <h1 class="font-display text-2xl lowercase sm:text-3xl">physarum</h1>
    <p class="max-w-prose font-mono text-xs text-white/50">
      {AGENTS.toLocaleString()} agents, each sensing three points ahead on a shared
      trail map and turning toward the strongest. Nothing tells them to build a
      network. <em>Physarum polycephalum</em> is a slime mould — a protist, not a
      fungus, and unrelated to the mushrooms next door.
    </p>
  </header>

  <div class="flex min-h-0 flex-1 items-center justify-center">
    <canvas bind:this={canvasEl} class="h-auto w-full max-w-[min(80vh,900px)]"></canvas>
  </div>

  <p class="font-mono text-xs text-white/40">
    {status}{#if fps} · {fps} fps in the worker · main thread idle{/if}
  </p>
</main>
