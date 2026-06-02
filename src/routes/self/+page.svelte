<script lang="ts">
  import { createRawSnippet, mount, onMount, unmount } from 'svelte';
  import '$lib/fonts/epilogue'; // .tier-essay body copy
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { profilePageNode } from '$lib/seo';
  import Prose from '$lib/components/Prose.svelte';
  import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';
  import VoronoiImage from '$lib/components/canvas/VoronoiImage.svelte';
  import AnythingButAnalogBanner from '$lib/components/banners/AnythingButAnalogBanner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { markdown } = $derived(data);

  // Defer the WebGL hero voronoi to the frame after first paint. The
  // static <img> below paints the bitmap LCP candidate, and the H1
  // "self" lands fast — the canvas's shader compile + first frame
  // shouldn't block either. Same pattern as /thoughts day30 — LH perf
  // gains ~20pts from this defer alone.
  let heroMounted = $state(false);
  onMount(() => {
    requestAnimationFrame(() => {
      heroMounted = true;
    });
  });

  // Extract banner images (alt contains "|") from the markdown,
  // replacing each with a <!-- slot-id --> marker.
  type BannerSlot = { src: string; alt: string };

  const extracted = $derived.by(() => {
    if (!markdown) return { processed: '', banners: {} as Record<string, BannerSlot> };
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

  // createRawSnippet mounts VoronoiImage components into Prose's slot system,
  // bypassing SSR hydration issues with {@html} markers. Mount is deferred
  // until the slot scrolls within 400px of the viewport — voronoi canvases
  // are expensive (each is a WebGL pipeline) and the 6 banners eat ~1s of
  // TBT if mounted eagerly.
  const voronoiSlots = $derived(
    Object.fromEntries(
      Object.entries(extracted.banners).map(([id, banner]) => {
        const src = banner.src;
        const alt = banner.alt;
        return [
          id,
          createRawSnippet(() => ({
            render: () => `<div data-voronoi-slot="${id}" class="my-12 -mx-6 md:-mx-9"></div>`,
            setup(node: Element) {
              let instance: ReturnType<typeof mount> | null = null;
              const io = new IntersectionObserver(
                (entries) => {
                  if (entries[0].isIntersecting && !instance) {
                    instance = mount(VoronoiImage, { target: node, props: { src, alt } });
                    io.disconnect();
                  }
                },
                { rootMargin: '400px' }
              );
              io.observe(node);
              return () => {
                io.disconnect();
                if (instance) unmount(instance);
              };
            },
          })),
        ];
      })
    )
  );

  // The <!-- anything-but-analog --> slot in self.md renders the ABA full-bleed banner.
  const abaSnippet = createRawSnippet(() => ({
    render: () => `<div data-aba-slot></div>`,
    setup(node: Element) {
      const instance = mount(AnythingButAnalogBanner, {
        target: node,
        props: { href: '/anything-but-analog' },
      });
      return () => unmount(instance);
    },
  }));

  const proseSlots = $derived({
    'anything-but-analog': abaSnippet,
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
  <link
    rel="preload"
    as="image"
    href="/assets/self-hero-mobile.webp"
    media="(orientation: portrait)"
    fetchpriority="high"
  />
  <link
    rel="preload"
    as="image"
    href="/assets/self-hero.webp"
    media="(orientation: landscape)"
    fetchpriority="high"
  />
</svelte:head>

<div class="relative h-dvh w-full overflow-hidden">
  <!-- LCP element: paints in one frame from the matching preload. The
       voronoi canvas overdraws once its WebGL pipeline warms up. -->
  <picture>
    <source srcset="/assets/self-hero-mobile.webp" media="(orientation: portrait)" />
    <img
      src="/assets/self-hero.webp"
      alt=""
      fetchpriority="high"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
    />
  </picture>
  {#if heroMounted}
    <VoronoiCanvas invert imageSrc="/assets/self-hero.webp" showLetters={false} fit="cover" />
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
