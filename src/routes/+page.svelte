<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import CloudCanvas from '$lib/components/canvas/CloudCanvas.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
</script>

<SeoHead canonical="/" />

<!--
  Homepage lays out into a single viewport: 25dvh clouds on top (CSS-mirrored
  so the darker end meets the page edge), 50dvh gallery strip, 25dvh clouds
  below (unmirrored — darker end at page bottom). Both render the same baked
  sky WebP; the prod build skips the WebGL shader entirely. No page scroll.
  The shared bottom Anchor from the layout is suppressed on `/` via the
  EXACT_HIDE set in Anchor.svelte so the 25dvh footer cloud fits in-layout.
-->
<main class="flex h-dvh w-full flex-col overflow-hidden">
  <section class="relative h-[25dvh] w-full overflow-hidden">
    <CloudCanvas mirror />
  </section>
  <div class="relative h-[50dvh] w-full">
    <Gallery />
  </div>
  <section class="relative h-[25dvh] w-full overflow-hidden">
    <CloudCanvas />
  </section>
</main>
