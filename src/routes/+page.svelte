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

  <!-- Countdown sits in the same bottom-left slot as the wordmark — the
       wordmark fades out for the duration so this is the only thing in
       that spot. Each digit crossfades in/out (250 ms in, scale-up out
       so the last one feels like it bursts as the game arrives). -->
  {#if gameMode.countdownText}
    <div
      class="pointer-events-none absolute bottom-6 left-6 z-50 font-mono text-3xl font-bold text-black md:bottom-8 md:left-8 md:text-4xl"
      out:fade={{ duration: 300 }}
    >
      {#key gameMode.countdownText}
        <span class="countdown-digit inline-block">{gameMode.countdownText}</span>
      {/key}
    </div>
  {/if}

  {#if gameMode.gameMounted}
    <div class="burst-in">
      <SnakeGame />
    </div>
  {/if}
</main>

<style>
  /* Each digit pops in fast, scales out as the next one (or the game)
     replaces it — last "1" still uses these timings so its exit doubles
     as the burst-up cue. */
  :global(.countdown-digit) {
    animation: countdown-in 250ms ease-out;
  }
  @keyframes countdown-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.85);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  /* Game wrapper just fades in — the burst-up motion is the game snake
     itself slithering up out of the bottom-left where the countdown was,
     not the canvas moving. */
  :global(.burst-in) {
    animation: burst-in 400ms ease-out;
  }
  @keyframes burst-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.countdown-digit),
    :global(.burst-in) {
      animation: none;
    }
  }
</style>
