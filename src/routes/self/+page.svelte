<script lang="ts">
  import { mount, onMount, unmount } from 'svelte';
  import '$lib/fonts/epilogue'; // .tier-essay body copy
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { profilePageNode } from '$lib/seo';
  import Prose from '$lib/components/Prose.svelte';
  import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';
  import VoronoiImage from '$lib/components/canvas/VoronoiImage.svelte';
  import AnythingButAnalogBanner from '$lib/components/banners/AnythingButAnalogBanner.svelte';
  import { assetAspect } from '$lib/asset-dimensions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { markdown } = $derived(data);

  // Voronoi mounts on the frame after hydration. With no bare <img>
  // underneath any more (removed below), there's nothing else painting
  // the hero — the H1 "self" + bg-black wrapper is what the visitor
  // sees until the WebGL pipeline warms and the canvas fades in.
  let heroMounted = $state(false);
  onMount(() => {
    requestAnimationFrame(() => {
      heroMounted = true;
    });
  });

  // Extract banner images (alt contains "|") from the markdown,
  // replacing each with a <!-- slot-id --> marker.
  interface BannerSlot { src: string; alt: string }

  const extracted = $derived.by(() => {
    if (!markdown) return { processed: '', banners: {} };
    const banners: Record<string, BannerSlot> = {};
    let i = 0;
    const imageRegex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
    const processed = markdown.replace(imageRegex, (_match, alt: string, src: string) => {
      if (!alt.includes('|')) return _match;
      const id = `voronoi-img-${i++}`;
      banners[id] = { src, alt };
      return `<!-- ${id} -->`;
    });
    return { processed, banners };
  });

  // Each banner is a mount-fn slot: Prose renders a placeholder <div> in its
  // single {@html} pass and calls mount() into it after hydration (no
  // interleaved {@render}, so no hydration_mismatch). VoronoiImage mounts
  // eagerly so its banner box reserves the correct layout space up front (via
  // the precomputed `aspect`) — no CLS. The expensive bit, the WebGL canvas,
  // is deferred inside VoronoiImage (LazyMount + idle) so the six shader
  // compiles still don't stack ~1s of TBT at load.
  const voronoiSlots = $derived(
    Object.fromEntries(
      Object.entries(extracted.banners).map(([id, banner]) => {
        const src = banner.src;
        const alt = banner.alt;
        const aspect = assetAspect(src);
        return [
          id,
          {
            class: 'my-12 -mx-6 md:-mx-9',
            mount: (node: HTMLElement) => {
              const instance = mount(VoronoiImage, { target: node, props: { src, alt, aspect } });
              return () => { void unmount(instance); };
            },
          },
        ];
      })
    )
  );

  // The <!-- anything-but-analog --> slot in self.md renders the ABA full-bleed banner.
  const abaSlot = {
    mount: (node: HTMLElement) => {
      const instance = mount(AnythingButAnalogBanner, {
        target: node,
        props: { href: '/anything-but-analog' },
      });
      return () => { void unmount(instance); };
    },
  };

  const proseSlots = $derived({
    'anything-but-analog': abaSlot,
    ...voronoiSlots,
  });
</script>

<SeoHead
  title="self"
  description="growing up in trenton, making art, and finding a way through."
  ogImage="/og/self.png"
  canonical="/self"
  ogType="profile"
  schema={profilePageNode({
    path: '/self',
    name: 'self — threesam',
  })}
/>

<svelte:head>
  <!-- Orientation-split preload pairs with the <picture> below: portrait
       viewports fetch the 170 KB portrait variant, landscape the 225 KB
       landscape. media= on each preload means only one fires per viewport,
       and it matches the <source>/<img> the browser will actually paint. -->
  <!-- crossorigin="anonymous" matches the WebGL texture fetch in the voronoi
       action (img.crossOrigin = 'anonymous'). Without it the preload's
       credentials mode differs from the actual request, so the browser won't
       reuse the preloaded bytes and warns the preload went unused. -->
  <link
    rel="preload"
    as="image"
    href="/assets/self-hero-mobile.webp"
    media="(orientation: portrait)"
    fetchpriority="high"
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    as="image"
    href="/assets/self-hero.webp"
    media="(orientation: landscape)"
    fetchpriority="high"
    crossorigin="anonymous"
  />
</svelte:head>

<!-- h-svh (not h-dvh) so iOS's address-bar collapse doesn't grow the
     container mid-scroll — the voronoi action resizes on width OR height
     change, which was reshuffling all the cells the moment the user
     started scrolling. svh is the static "small" viewport height that
     never moves once the page is settled. -->
<div class="relative h-svh w-full overflow-hidden bg-black">
  {#if heroMounted}
    <!-- No bare <img> any more — the bare bitmap appearing for a beat
         before voronoi took over read as "two images stacked" on mobile.
         The preload above still primes the cache so the voronoi action's
         own image fetch is instant; LCP falls to the H1 "self" but the
         visual integrity of the hero is the priority here. -->
    <VoronoiCanvas
      invert
      imageSrc="/assets/self-hero.webp"
      mobileImageSrc="/assets/self-hero-mobile.webp"
      showLetters={false}
      fit="cover"
    />
  {/if}
  <h1
    class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold uppercase tracking-base text-white md:bottom-20 md:left-20 md:text-8xl"
  >
    self
  </h1>
</div>

{#if markdown}
  <section
    class="tier-essay mx-auto max-w-3xl px-6 py-12 text-black md:px-9 md:py-24"
  >
    <Prose content={extracted.processed} slots={proseSlots} />
  </section>
{/if}
