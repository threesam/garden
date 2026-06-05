<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import BrandSignoff from '$lib/components/frame/BrandSignoff.svelte';
  import SnakeGame from '$lib/components/snake/SnakeGame.svelte';
  import { fade } from 'svelte/transition';
  import { gameMode } from '$lib/game-mode.svelte';
  import { SITE_PAGES, SITE_URL, homePageNode, itemListNode } from '$lib/seo';

  // Structured site index for search + answer engines. Mirrors the
  // natural-language /llms.txt and the sitemap so the same SITE_PAGES
  // source feeds all three crawl surfaces.
  const homeSchema = [
    homePageNode(),
    itemListNode({
      path: '/',
      name: 'threesam — site index',
      items: SITE_PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, name: p.label })),
    }),
  ];
</script>

<SeoHead canonical="/" ogImage="/og/home.png" schema={homeSchema} />

<!--
  Single-viewport homepage on a flat --coin field: a 50dvh gallery strip
  centered between 25dvh top/bottom spacers. No page scroll. Clicking the
  "s" in the threesam wordmark triggers an easter-egg snake game that fades
  the gallery, transforms "threesam" → "snake", and flips the menu coin into
  an x glyph for quit. State lives in $lib/game-mode.
-->
<main class="relative flex h-dvh w-full flex-col overflow-hidden bg-coin">
  <div class="h-[25dvh] w-full"></div>
  <div
    class="relative h-[50dvh] w-full transition-opacity duration-500 ease-out"
    class:opacity-0={gameMode.active}
    class:pointer-events-none={gameMode.active}
  >
    <Gallery />
  </div>
  <div class="h-[25dvh] w-full"></div>

  <BrandSignoff heading gameClickable />

  {#if gameMode.gameMounted}
    <div transition:fade={{ duration: 500 }}>
      <SnakeGame />
    </div>
  {/if}
</main>
