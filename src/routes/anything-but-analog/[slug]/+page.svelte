<script lang="ts">
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { creativeWorkNode } from '$lib/seo';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const target = $derived(`/anything-but-analog#${data.slug}`);
  // Per-slug OG images aren't generated; use the section's generic 1200×630 card.
  const ogUrl = '/og/anything-but-analog.png';
  const description = $derived(
    data.description ?? `${data.title} (${data.date}), generative sketch.`,
  );

  onMount(() => {
    window.location.replace(target);
  });
</script>

<SeoHead
  title="{data.title} — anything but analog"
  {description}
  ogImage={ogUrl}
  canonical="/anything-but-analog/{data.slug}"
  schema={creativeWorkNode({
    path: `/anything-but-analog/${data.slug}`,
    name: data.title,
    image: ogUrl,
    datePublished: data.date,
  })}
  breadcrumbTrail={[
    { path: '/', name: 'threesam' },
    { path: '/anything-but-analog', name: 'anything but analog' },
    { path: `/anything-but-analog/${data.slug}`, name: data.title },
  ]}
/>

<!--
  Server renders rich social metadata so crawlers see the sketch title/OG.
  onMount replaces location to the scroll-snap gallery at
  /anything-but-analog#<slug> — mirrors ArtRedirect in the Next.js original.
-->
<main class="flex h-dvh items-center justify-center bg-black text-white">
  <noscript>
    <a href={target} class="underline">continue to {data.title}</a>
  </noscript>
</main>
