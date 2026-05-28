<script lang="ts">
  import { createRawSnippet, mount, unmount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { profilePageNode } from '$lib/seo';
  import Prose from '$lib/components/Prose.svelte';
  import VoronoiCanvas from '$lib/components/canvas/VoronoiCanvas.svelte';
  import VoronoiImage from '$lib/components/canvas/VoronoiImage.svelte';
  import AnythingButAnalogBanner from '$lib/components/banners/AnythingButAnalogBanner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { markdown } = $derived(data);

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
  // bypassing SSR hydration issues with {@html} markers.
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
              const instance = mount(VoronoiImage, { target: node, props: { src, alt } });
              return () => unmount(instance);
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
  preloadImage="/assets/self-hero.webp"
  ogType="profile"
  schema={profilePageNode({
    path: '/self',
    name: 'self — threesam',
    description: 'growing up in trenton, making art, and finding a way through.',
  })}
/>

<div class="relative h-dvh w-full overflow-hidden">
  <VoronoiCanvas invert imageSrc="/assets/self-hero.webp" showLetters={false} fit="cover" />
  <h1
    class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:bottom-20 md:left-20 md:text-8xl"
    style="color: var(--white)"
  >
    self
  </h1>
</div>

{#if markdown}
  <section
    class="tier-essay mx-auto max-w-3xl px-6 py-12 md:px-9 md:py-24"
    style="color: var(--black)"
  >
    <Prose content={extracted.processed} slots={proseSlots} />
  </section>
{/if}
