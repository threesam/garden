<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
</script>

<SeoHead canonical="/" />

<!--
  Single-viewport homepage on a flat --coin field: a 50dvh gallery strip
  centered between 25dvh top/bottom spacers. No page scroll. The animated cloud
  sky was retired for the homepage (no image fetched); the shared CloudCanvas
  still runs elsewhere via the layout Anchor, which stays suppressed on `/`.
-->
<main class="flex h-dvh w-full flex-col overflow-hidden" style="background-color: var(--coin);">
  <div class="h-[25dvh] w-full"></div>
  <div class="relative h-[50dvh] w-full">
    <Gallery />
  </div>
  <div class="h-[25dvh] w-full"></div>
</main>
