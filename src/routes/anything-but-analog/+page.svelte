<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { collectionPageNode } from '$lib/seo';
  import ParticleTextCanvas from '$lib/components/canvas/ParticleTextCanvas.svelte';
  import ArtScrollSync from '$lib/components/art/ArtScrollSync.svelte';
  import ArtGallery from '$lib/components/art/ArtGallery.svelte';
  import { visibleSketches } from '$lib/art/registry';

  const meta = visibleSketches.map((s) => ({
    slug: s.slug,
    date: s.date,
    description: s.description,
  }));
</script>

<SeoHead
  title="anything but analog"
  description="generative sketches."
  ogImage="/og/anything-but-analog.png"
  canonical="/anything-but-analog"
  schema={collectionPageNode({
    path: '/anything-but-analog',
    name: 'anything but analog — threesam',
  })}
/>

<main
  id="art-scroller"
  class="h-dvh snap-y snap-mandatory overflow-y-scroll bg-black"
>
  <ArtScrollSync />
  <section
    id="hero"
    data-art-slug="hero"
    class="relative h-dvh w-full snap-start overflow-hidden"
  >
    <ParticleTextCanvas />
  </section>
  <ArtGallery sketches={meta} />
</main>
