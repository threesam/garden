<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Prose from '$lib/components/Prose.svelte';
  import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { markdown } = $derived(data);
</script>

<SeoHead
  title="self"
  description="growing up in trenton, making art, and finding a way through."
  ogImage="/og/self.png"
  canonical="/canvas/self"
/>

<div>
  <div class="relative h-dvh w-full overflow-hidden">
    <VoronoiCanvas invert imageSrc="/assets/self-hero.webp" showLetters={false} fit="cover" />
    <h1
      class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:bottom-20 md:left-20 md:text-8xl"
      style="color: white"
    >
      self
    </h1>
  </div>

  {#if markdown}
    <section
      class="tier-essay mx-auto max-w-3xl px-6 py-12 md:px-9 md:py-24"
      style="color: var(--black)"
    >
      <Prose content={markdown} />
    </section>
  {/if}
</div>
