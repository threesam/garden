<script lang="ts">
  import { page } from '$app/stores';
  import LazyMount from '$lib/components/LazyMount.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import { SITE_ITEMS, THOUGHT_ITEMS } from '$lib/components/gallery/items';
  import BrandSignoff from '$lib/components/frame/BrandSignoff.svelte';

  // Every page lands the same way: the dark body fades up into the coin field
  // and the sliding gallery carries you somewhere else. It's the homepage
  // ending, reused as the site's ending.
  //
  // Hidden where it would be redundant or fight the page: the homepage already
  // *is* this, and the anything-but-analog routes own the full viewport for
  // their own scroll.
  const HIDE_PREFIXES = ['/anything-but-analog'];
  const EXACT_HIDE = new Set(['/']);

  const pathname = $derived($page.url.pathname);

  const hidden = $derived(
    EXACT_HIDE.has(pathname) ||
      HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );

  // Inside /thoughts the six sections are the wrong offer — you're already in
  // the reading room, so the strip carries more reading instead.
  const items = $derived(pathname.startsWith('/thoughts') ? THOUGHT_ITEMS : SITE_ITEMS);

  let anchorEl = $state<HTMLDivElement | null>(null);
  /** Colour the fade starts from — resolved from the page, not assumed. */
  let fadeFrom = $state('var(--black, #1a1a14)');

  /**
   * Pages don't agree on a closing colour: /self ends in a cream block while
   * the essays end in black, and the body underneath is dark either way. A
   * fixed start colour is therefore a hard band on half the site, and
   * `transparent` just reveals the dark body under the cream. So read what the
   * page actually ends with and ramp from that.
   */
  function resolveFadeFrom(): void {
    const el = anchorEl;
    if (!el) return;
    const opaque = (c: string): boolean =>
      c !== '' && c !== 'transparent' && !c.startsWith('rgba(0, 0, 0, 0)');

    // Descend the trailing edge keeping the DEEPEST opaque background, but
    // only through elements that still span the full width. Two traps:
    // stopping at the first match reports the layout's cream wrapper for every
    // route, and descending without the width guard walks into a white
    // thought-card and reports that instead of the black page behind it.
    let node: Element | null = el.previousElementSibling;
    let found = '';
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (opaque(bg)) found = bg;
      const width = node.getBoundingClientRect().width;
      const next: Element | null = node.lastElementChild;
      if (!next) break;
      // A child narrower than its parent is content sitting on the background,
      // not the background itself.
      if (next.getBoundingClientRect().width < width * 0.9) break;
      node = next;
    }
    fadeFrom = found || getComputedStyle(document.body).backgroundColor;
  }

  $effect(() => {
    // Re-resolve per route: the closing colour changes with the page.
    void pathname;
    resolveFadeFrom();
  });
</script>

{#if !hidden}
  <div class="anchor relative w-full" bind:this={anchorEl}>
    <div
      class="fade pointer-events-none"
      aria-hidden="true"
      style:--anchor-from={fadeFrom}
    ></div>

    <div class="bg-coin">
      <!-- 200px scroll-ahead so the canvases warm before the strip is reached. -->
      <LazyMount class="relative h-[46dvh] w-full md:h-[54dvh]" rootMargin="200px">
        <Gallery {items} />
      </LazyMount>

      <!-- The signoff is `absolute bottom-6` against its nearest positioned
           ancestor, so it needs its own band — without one it lands on top of
           the cards. -->
      <div class="relative h-24 md:h-28">
        <BrandSignoff tone="light" />
      </div>
    </div>
  </div>
{/if}

<style>
  /* Generous height so the hand-off reads as atmosphere rather than a stripe.
     --anchor-from is resolved from the page above at runtime; the fallback
     covers SSR and the no-JS case. */
  .fade {
    height: 24dvh;
    background: linear-gradient(
      to bottom,
      var(--anchor-from, var(--black, #1a1a14)),
      var(--coin, #e8a317)
    );
  }
</style>
