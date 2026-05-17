<script lang="ts">
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { sketch } = $derived(data);

  const target = $derived(`/anything-but-analog#${sketch.slug}`);
  const ogUrl = $derived(`/og/anything-but-analog/${sketch.slug}.png`);

  onMount(() => {
    window.location.replace(target);
  });
</script>

<SeoHead
  title="{sketch.title} — anything but analog"
  description="{sketch.title} ({sketch.date}), generative sketch."
  ogImage={ogUrl}
  canonical="/anything-but-analog/{sketch.slug}"
/>

<!--
  Server renders rich social metadata so crawlers see the sketch title/OG.
  The onMount above redirects humans to the scroll-snap gallery at
  /anything-but-analog#<slug> — mirrors ArtRedirect in the Next.js original.
-->
<main
  class="flex h-dvh items-center justify-center"
  style="background-color: var(--black); color: var(--white);"
>
  <noscript>
    <a href={target} class="underline">continue to {sketch.title}</a>
  </noscript>
</main>
