<script lang="ts">
  // Bottom-corner brand sign-off: the "threesam" wordmark and the "certainly
  // uncertain" tagline. Used on the homepage and at the bottom of the Anchor
  // footer so the mark reads the same everywhere.
  //
  // `heading` renders the wordmark as <h1> (the homepage's sole crawlable
  // heading); elsewhere it's a <div>, since those pages already own their <h1>.
  // `tone` flips the text colour: 'dark' (--black) over the coin homepage,
  // 'light' (--white) over the Anchor's dark cloud-footer bottom.
  // The parent must be positioned (relative) — the corners anchor to it.
  // `gameClickable` exposes the snake-game easter egg: clicking the "s"
  // toggles gameMode and triggers the letter-collapse → "snake" sequence.
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { building } from '$app/environment';
  import { gameMode } from '$lib/game-mode.svelte';
  import { diveMode, diveUrl } from '$lib/dive-mode.svelte';
  import WordmarkGlyph from './WordmarkGlyph.svelte';
  import { LETTERS, letterAdvanceEm } from '$lib/wordmark';

  let {
    heading = false,
    tone = 'dark',
    gameClickable = false,
  }: {
    heading?: boolean;
    tone?: 'dark' | 'light';
    gameClickable?: boolean;
  } = $props();
  const tag = $derived(heading ? 'h1' : 'div');
  const color = $derived(tone === 'light' ? 'text-white' : 'text-black');

  // "threesam" + one inert tail — "n a k e" after the m. Letters are
  // inline-blocks in normal inline flow, NOT flex items: flex blockifies its
  // items' computed display, which makes axe-core's target-size rule refuse
  // the WCAG 2.5.8 inline-text exemption (isInTextBlock sees blocks, not a
  // word) and flag the sub-24px egg letters. As inline text the letters are
  // exempt at any size. When game mode is active the original t/h/r/e/e/a/m
  // collapse (opacity 0, max-width 0) so the "s" slides to the start, then
  // the n/a/k/e tail expands.
  // Every letter of "threesam" is a dot glyph — LETTERS is the hand-edited
  // grid, one entry per letter, in order. They stay eight separate spans (not
  // one image) because the snake sequence collapses them individually, and
  // because the s and a carry the two easter eggs.
  //
  // The visible letters are decorative; a single sr-only "threesam" supplies
  // the <h1>'s accessible name. The snake and invaders letters are aria-hidden
  // for the same reason — they are always in the DOM, just collapsed, so
  // without it the heading reads "threesamspce invadersnake".
  const [L_T, L_H, L_R, L_E1, L_E2, L_S, L_A, L_M] = LETTERS;
  const PRE_LETTERS = [L_H, L_R, L_E1, L_E2];
  // the "a" between s and m is its own span: clicking it starts space
  // invaders (homepage only) and collapses the wordmark around it.
  // Ready only while the letter is actually visible — during game/message
  // modes it collapses, and a collapsed control must be neither tabbable
  // nor able to start invaders over the active state.
  const SNAKE_TAIL = ['n', 'a', 'k', 'e'];
  // Invaders spells out AROUND the "a", not after it — the a is the third
  // letter of "space", so unlike snake it needs a lead as well as a tail. The
  // dot-glyph "a" is the letter that stays put; everything else collapses and
  // these text letters grow in on either side of it.
  const INV_LEAD = ['s', 'p'];
  const INV_TAIL = ['c', 'e', ' ', 'i', 'n', 'v', 'a', 'd', 'e', 'r', 's'];
  const active = $derived(gameMode.active);
  // Each game claims a different letter and spells a different word: snake
  // keeps the "s", invaders keeps the "a".
  const isSnake = $derived(gameMode.active && gameMode.game === 'snake');
  const isInvaders = $derived(gameMode.active && gameMode.game === 'invaders');
  // The letter easter eggs are precision targets — on coarse pointers they're
  // both undiscoverable and sub-24px tap targets (WCAG 2.5.8), so they stay
  // plain text there. SSR renders non-interactive; fine pointers upgrade on
  // hydration (the eggs need JS anyway).
  let finePointer = $state(false);
  onMount(() => {
    finePointer = window.matchMedia('(pointer: fine)').matches;
  });
  const egGame = $derived(gameClickable && finePointer);
  const invadersReady = $derived(egGame && !gameMode.active);

  // Clicking the tagline runs the send-off: EVERYTHING fades for 1s —
  // words here, plus the gallery, wordmark, and guide coin via diveMode
  // (game-screen style) — while the diver holds his spot on the bare
  // coin field, THEN we navigate — pyredivers.com opens on marigold with
  // only the stick figure, standing exactly where this one stands.
  // Modified clicks (new tab, etc.) keep the plain anchor navigation;
  // reduced motion is handled inside diveMode.start (immediate hand-off).
  const divingOut = $derived(diveMode.leaving);
  // one href for every path — carries ?test so open-in-new-tab and the
  // no-JS fallback reach pyre analytics-clean too, not just the JS dive
  const diveHref = $derived(diveUrl(building ? null : page.url.searchParams.get('test')));
  const diveOut = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    diveMode.start();
  };
</script>

<svelte:element
  this={tag}
  class="wordmark absolute bottom-6 left-6 z-50 font-display {color} md:bottom-8 md:left-8"
  class:is-game={isSnake}
  class:is-invaders={isInvaders}
  class:wordmark-hidden={gameMode.wordmarkSlotOccupied}
  class:diving-away={divingOut}
>
  <span class="sr-only">threesam</span
  ><span class="letter" style:--letter-w="{letterAdvanceEm(L_T)}em"><WordmarkGlyph letter={L_T} /></span
  >{#each PRE_LETTERS as l, i (`pre-${i}`)}<span class="letter" style:--letter-w="{letterAdvanceEm(l)}em"
      ><WordmarkGlyph letter={l} /></span
    >{/each}<!-- svelte-ignore a11y_no_noninteractive_tabindex --><span
    class="letter s-letter"
    style:--letter-w="{letterAdvanceEm(L_S)}em"
    aria-label={egGame ? 'play snake' : undefined}
    class:clickable={egGame && !active}
    onclick={egGame ? () => { if (active) { gameMode.stop(); } else { gameMode.start('snake'); } } : undefined}
    role={egGame ? 'button' : undefined}
    tabindex={egGame ? 0 : undefined}
    onkeydown={egGame
      ? (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (active) gameMode.stop();
            else gameMode.start('snake');
          }
        }
      : undefined}
  ><WordmarkGlyph letter={L_S} /></span
  >{#each INV_LEAD as l, i (`lead-${i}`)}<span class="inv" aria-hidden="true" style:--inv-delay="{120 + i * 110}ms"
    >{l}</span
  >{/each}<!-- svelte-ignore a11y_no_noninteractive_tabindex --><span
    class="letter a-letter"
    style:--letter-w="{letterAdvanceEm(L_A)}em"
    class:clickable={invadersReady}
    role={invadersReady ? 'button' : undefined}
    tabindex={invadersReady ? 0 : undefined}
    aria-label={invadersReady ? 'play space invaders' : undefined}
    onclick={egGame
      ? () => {
          if (invadersReady) gameMode.start('invaders');
        }
      : undefined}
    onkeydown={egGame
      ? (e: KeyboardEvent) => {
          if ((e.key === 'Enter' || e.key === ' ') && invadersReady) {
            e.preventDefault();
            gameMode.start('invaders');
          }
        }
      : undefined}
  ><WordmarkGlyph letter={L_A} /></span
  >{#each INV_TAIL as l, i (`inv-${i}`)}<span class="inv" aria-hidden="true" style:--inv-delay="{340 + i * 70}ms"
    >{l}</span
  >{/each}<span class="letter m-letter" style:--letter-w="{letterAdvanceEm(L_M)}em"><WordmarkGlyph letter={L_M} /></span
  >{#each SNAKE_TAIL as l, i (`tail-${i}`)}
    <span class="tail" aria-hidden="true" style:--tail-delay="{200 + i * 130}ms">{l}</span>
  {/each}
  <!-- The butted-tag formatting around every wordmark sibling above is
       load-bearing: inter-element whitespace renders in inline flow. -->
</svelte:element>
<!-- Tagline (anchored bottom-right). Fades out alongside the gallery during
     the snake game so the active experience reads as the only content. The
     tagline is now the diver alone at every width — the words are gone, and
     he is the whole door to pyredivers.com. -->
<p
  class="tagline absolute right-6 bottom-6 z-10 text-right text-sm leading-none {color} md:right-8 md:bottom-8 md:text-base"
  class:tagline-hidden={active}
><a
    class="tagline-link"
    class:diving-out={divingOut}
    href={diveHref}
    aria-label="certainly uncertain — dive into pyre divers"
    onclick={diveOut}
  ><span class="diver"
      ><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none">
        <circle cx="16" cy="7" r="3.4" />
        <path d="M16 10.5 L16 20 M16 13 L9 17 M16 13 L23 17 M16 20 L11 27 M16 20 L21 27" />
      </g>
    </svg></span></a
  >
</p>

<style>
  .wordmark {
    /* The mark is 171 dot-columns wide, so how well the dots resolve is a
       function of its total width, not the type scale. Sized off the viewport
       and capped: large enough that the grid reads as dots rather than mud,
       small enough not to dominate the corner. */
    font-size: clamp(1.75rem, 4.6vw, 3.25rem);
    /* one line, always — inline flow would soft-wrap between the
       inline-block letters if the corner ever got that tight. */
    white-space: nowrap;
  }
  .letter,
  .tail,
  .inv {
    display: inline-block;
    /* overflow: hidden moves an inline-block's baseline to its bottom edge;
       top-aligning the equal-height boxes keeps the glyphs where flex put
       them and stops the line box growing under the strut. */
    vertical-align: top;
    overflow: hidden;
    white-space: pre;
    transition:
      max-width 450ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 350ms ease-out;
    /* Per-glyph, not a flat 1em: the dot letters differ in width (m is 1.16em,
       r is 0.4em) and a fixed 1em silently clipped the wide ones under
       overflow: hidden. Text tails have no --letter-w and keep the 1em. */
    max-width: var(--letter-w, 1em);
    opacity: 1;
  }
  /* INVADERS ACTIVE — every letter but the dot "a" collapses, and the lead and
     tail grow in around it, so the mark reads "space invaders". */
  .is-invaders .letter:not(.a-letter) {
    max-width: 0;
    opacity: 0;
  }
  .is-invaders .inv {
    max-width: 1em;
    opacity: 1;
    transition-delay: var(--inv-delay, 0ms);
  }
  /* Snake and invaders letters both start collapsed and silent. */
  .tail,
  .inv {
    max-width: 0;
    opacity: 0;
    transition-delay: 0ms;
  }
  .s-letter.clickable {
    cursor: pointer;
  }
  .tagline {
    transition: opacity 500ms ease-out;
  }
  .tagline-hidden {
    opacity: 0;
    pointer-events: none;
  }
  /* Wordmark hides while the countdown or game owns the bottom-left slot.
     Re-appears on close so the letter-collapse animation can reverse. */
  .wordmark {
    transition: opacity 200ms ease-out;
  }
  .wordmark-hidden {
    opacity: 0;
    pointer-events: none;
  }
  /* GAME ACTIVE — every non-s letter collapses; the snake tail expands
     with staggered delays so the wordmark reads "s" → "snake". */
  .is-game .letter:not(.s-letter) {
    max-width: 0;
    opacity: 0;
  }
  .is-game .tail {
    max-width: 1em;
    opacity: 1;
    transition-delay: var(--tail-delay, 0ms);
  }

  /* HOVER PREVIEW (desktop only — :has() does the parent-of-hovered-child
     trick that CSS otherwise can't): hovering the clickable "s" fades the
     other letters to transparent while keeping their width, so the "s" stays
     put. Crucially it does NOT collapse them (max-width stays 1em) — collapsing
     would slide the "s" leftward out from under the cursor, dropping :hover and
     re-firing it in a flicker loop. Only a click runs the full collapse-to-
     "snake" sequence (.is-game), where the layout shift is intended.

     The "a" runs the same sibling fade while its glyph morphs into the
     alien, so both hover eggs present the same way: one letter left alone
     on the field. The "m" is plain text since the message form left (#279). */
  @media (hover: hover) {
    .wordmark:has(.s-letter.clickable:hover) .letter:not(.s-letter),
    .wordmark:has(.s-letter.clickable:focus-visible) .letter:not(.s-letter),
    .wordmark:has(.a-letter.clickable:hover) .letter:not(.a-letter),
    .wordmark:has(.a-letter.clickable:focus-visible) .letter:not(.a-letter) {
      opacity: 0;
    }
  }
  /* The whole tagline is the door to pyredivers.com — ?dive tells the far
     side to open on our marigold and run the arrival sequence, so the hop
     reads as one scene. Reveal mechanics inherited from the old alien gag
     (#215); the alien itself now lives in the wordmark's "a". */
  .tagline-link {
    display: inline-block;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  /* the send-off: words fade for 1s before navigation; the diver holds
     open (even if the cursor drifts) so the hand-off is stick-to-stick.
     The wordmark leaves on the same clock (gallery + guide fade via
     diveMode in the page/layout) — everything but him and the coin. */
  .wordmark.diving-away {
    opacity: 0;
    transition: opacity 1s ease;
    pointer-events: none;
  }
  .tagline-link > span:not(.diver) {
    transition: opacity 1s ease;
  }
  .tagline-link.diving-out {
    pointer-events: none;
  }
  .tagline-link.diving-out > span:not(.diver) {
    opacity: 0;
  }
  /* the diver stands between the words at all times — no hover reveal.
     touch made :hover sticky (it got stuck open anyway), and always-on
     reads cleaner. He just holds his spot; the send-off fades the words
     around him. */
  .diver {
    display: inline-block;
    vertical-align: middle;
    width: 1.4em;
    opacity: 1;
    cursor: pointer;
    color: inherit;
  }
  /* mobile: the words are hidden, so he stands alone in the corner — he
     centres on the "threesam" wordmark's MIDLINE opposite (its bottom-6
     anchor + half its 36px line box = 42px up). Aiming his feet at the
     wordmark's box bottom instead put him ~12px under the letters, since
     that box sits 8px below the actual text baseline.
     With no words beside him there's no strut to fight, so the svg's
     bottom edge is simply the tagline's own bottom, so the three terms
     below are the whole story: the wordmark's own bottom anchor (bottom-6),
     half its 36px line box (which lands us on its midline), and how far his
     ink centre rides above the svg's bottom edge — the figure is drawn to
     viewBox y=3.6→27 of 32, putting its centre 0.522 of a 1.4em box up.
     Kept in rem/em rather than the measured 31.8px so a root- or
     tagline-font change carries the alignment along with it.
     Moving the box rather than transforming him keeps the tap target under
     the figure. Desktop keeps vertical-align:middle between the words. */
  @media (max-width: 767px) {
    .tagline {
      bottom: calc(1.5rem + 1.125rem - 0.73em);
    }
  }
  .diver :global(svg) {
    width: 1.4em;
    height: 1.4em;
    display: block;
  }
  /* The "a" that is sometimes an alien: hover/focus crossfades the glyph
     to the invader (homepage only — gameClickable gates the handlers). */
  .a-letter {
    position: relative;
  }
  .a-letter.clickable {
    cursor: pointer;
  }
  @media (prefers-reduced-motion: reduce) {
    .letter,
    .tail,
    .inv,
    .diver {
      transition: none;
    }
  }
</style>
