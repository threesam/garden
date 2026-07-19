<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import BrandSignoff from '$lib/components/frame/BrandSignoff.svelte';
  import SnakeGame from '$lib/components/snake/SnakeGame.svelte';
  import InvadersGame from '$lib/components/invaders/InvadersGame.svelte';
  import MessageLetter from '$lib/components/message/MessageLetter.svelte';
  import SendAction from '$lib/components/message/SendAction.svelte';
  import { fade } from 'svelte/transition';
  import { gameMode } from '$lib/game-mode.svelte';
  import { messageMode } from '$lib/message-mode.svelte';
  import { diveMode } from '$lib/dive-mode.svelte';
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
<!-- `inert` while messageMode owns the screen — removes the gallery,
     wordmark, etc. from tab order + the a11y tree so keyboard users
     can't reach behind-the-modal content. The Guide coin (top-right)
     lives outside <main>, so it stays interactive as the close path. -->
<main
  class="relative flex h-dvh w-full flex-col overflow-hidden bg-coin"
  inert={messageMode.active}
>
  <div class="h-[25dvh] w-full"></div>
  <div
    class="relative h-[50dvh] w-full transition-opacity duration-500 ease-out"
    class:duration-1000={diveMode.leaving}
    class:opacity-0={gameMode.active || messageMode.active || messageMode.revealing || diveMode.leaving}
    class:pointer-events-none={gameMode.active ||
      messageMode.active ||
      messageMode.revealing ||
      diveMode.leaving}
  >
    <Gallery />
  </div>
  <div class="h-[25dvh] w-full"></div>

  <BrandSignoff heading gameClickable messageClickable />

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

  <!-- SnakeGame wrapped in transition:fade so the dead canvas dissolves
       smoothly when restart()/stop() unmounts it — without this, the
       canvas snapped off instantly while the countdown digit / wordmark
       faded in. Svelte defers DOM removal until the outro completes,
       so the component's own cleanup runs at fade-end. -->
  {#if gameMode.gameMounted}
    <div transition:fade={{ duration: 400 }}>
      {#if gameMode.game === 'invaders'}
        <InvadersGame />
      {:else}
        <SnakeGame />
      {/if}
    </div>
  {/if}

  <!-- Post-death choreography. The dead snake canvas stays painted; the
       bottom-left wordmark slot stages two beats in sequence (never
       overlapping — gameMode times the gap so the out-fade completes
       before "again?" mounts):

       1. "game over" lingers ~2 s then fades out.
       2. "again?" fades in — click runs gameMode.restart(), which
          synchronously hands the slot off to the "3" countdown digit. -->
  {#if gameMode.gameOver}
    <div
      class="pointer-events-none absolute bottom-6 left-6 z-50 font-mono text-3xl font-bold uppercase tracking-pill text-black md:bottom-8 md:left-8 md:text-4xl"
      in:fade={{ duration: 250 }}
      out:fade={{ duration: 400 }}
    >
      game over
    </div>
  {/if}

  {#if gameMode.replayReady}
    <button
      type="button"
      class="absolute bottom-6 left-6 z-50 cursor-pointer font-mono text-3xl font-bold text-black md:bottom-8 md:left-8 md:text-4xl"
      onclick={() => { gameMode.restart(); }}
      in:fade={{ duration: 250 }}
      out:fade={{ duration: 300 }}
    >
      again?
    </button>
  {/if}

</main>

<!-- "message me?" letter mode. Sits OUTSIDE main so it stays interactive
     while main is `inert` — Gallery + wordmark + tagline have already
     faded out (handled by the active checks above and inside
     BrandSignoff). The cream letter card animates in
     centered/fullscreen, and the bottom-right SendAction morphs from
     "message me?" to "send it?" when both fields are filled. The menu
     coin top-right flips to "x" (see Guide) so the user can quit. -->
{#if messageMode.active}
  <MessageLetter />
  <SendAction />
{/if}

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
  @media (prefers-reduced-motion: reduce) {
    :global(.countdown-digit) {
      animation: none;
    }
  }
</style>
