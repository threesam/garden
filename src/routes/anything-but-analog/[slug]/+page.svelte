<script lang="ts">
  import { onMount } from 'svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const target = $derived(`/anything-but-analog#${data.slug}`);
  const ogUrl = $derived(`/og/anything-but-analog/${data.slug}.png`);

  onMount(() => {
    window.location.replace(target);
  });
</script>

<SeoHead
  title="{data.title} — anything but analog"
  description="{data.title} ({data.date}), generative sketch."
  ogImage={ogUrl}
  canonical="/anything-but-analog/{data.slug}"
/>

<!--
  Server renders rich social metadata so crawlers see the sketch title/OG.
  onMount replaces location to the scroll-snap gallery at
  /anything-but-analog#<slug> — mirrors ArtRedirect in the Next.js original.
-->
<main
  class="flex h-dvh items-center justify-center"
  style="background-color: var(--black); color: var(--white);"
>
  <noscript>
    <a href={target} class="underline">continue to {data.title}</a>
  </noscript>
</main>
