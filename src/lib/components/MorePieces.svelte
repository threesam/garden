<script lang="ts">
  // "Keep exploring" strip for the bottom of deep pages, which were otherwise
  // dead ends — a reader finishing a piece had nowhere to go but the browser
  // back button. Draws from the two registries that already exist (POSTS for
  // dated pieces, SITE_PAGES for the evergreen sections) so there is no third
  // list to drift, excludes wherever you already are, and shuffles the order
  // each load so the same page doesn't always point the same way.
  //
  // Native horizontal scroll with snap rather than an animation loop: it's
  // keyboard- and touch-navigable for free and inherently respects reduced
  // motion. The homepage gallery earns its rAF engine by being the hero; a
  // footer does not.
  import { buildExploreList } from '$lib/explore';

  interface Props {
    /** Path of the current page, excluded from the strip. */
    current: string;
    /** Optional heading override. */
    heading?: string;
  }

  let { current, heading = 'keep exploring' }: Props = $props();

  // Fisher–Yates on a copy — varied across loads so the same page doesn't
  // always point the same way. Ordering is passed into buildExploreList, which
  // owns the (tested) merge/dedupe/exclude logic.
  function shuffle<T>(input: readonly T[]): T[] {
    const out = [...input];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = out[i];
      const b = out[j];
      // Bounded loop indices — both are in range by construction.
      if (a !== undefined && b !== undefined) {
        out[i] = b;
        out[j] = a;
      }
    }
    return out;
  }

  // Derived, not a one-time const: if the same instance is reused across a
  // client nav to another piece, `current` changes and the list rebuilds
  // (and re-shuffles, which is the intent).
  const cards = $derived(buildExploreList(current, shuffle));
</script>

{#if cards.length > 0}
  <nav aria-label={heading} class="more-pieces">
    <p class="mb-4 font-mono text-xs uppercase tracking-section text-zinc-500 md:text-sm">
      {heading}
    </p>
    <ul class="strip">
      {#each cards as card (card.href)}
        <li>
          <a href={card.href} class="card">
            <span class="card-title font-display uppercase tracking-base">{card.title}</span>
            <span class="card-blurb font-mono text-white/50">{card.blurb}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .strip {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scroll-snap-type: x proximity;
    /* Momentum scroll on iOS, thin scrollbar elsewhere. */
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .card {
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 15rem;
    flex: 0 0 auto;
    padding: 0.85rem 1rem;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 0.75rem;
    transition:
      border-color 0.25s ease,
      transform 0.25s ease;
  }
  .card:hover {
    border-color: var(--color-coin, #e8a317);
    transform: translateY(-2px);
  }
  .card:focus-visible {
    outline: 2px solid var(--color-coin, #e8a317);
    outline-offset: 2px;
  }
  .card-title {
    font-size: 0.95rem;
    color: #fff;
  }
  .card-blurb {
    font-size: 0.72rem;
    line-height: 1.35;
    /* Two lines, then ellipsis — blurbs vary in length and a ragged strip
       reads as broken rather than casual. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
  }
</style>
