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
  import { gameMode } from '$lib/game-mode.svelte';
  import { messageMode } from '$lib/message-mode.svelte';

  let {
    heading = false,
    tone = 'dark',
    gameClickable = false,
    messageClickable = false,
  }: {
    heading?: boolean;
    tone?: 'dark' | 'light';
    gameClickable?: boolean;
    messageClickable?: boolean;
  } = $props();
  const tag = $derived(heading ? 'h1' : 'div');
  const color = $derived(tone === 'light' ? 'text-white' : 'text-black');

  // "threesam" + two inert tails — "n a k e" after the m, and "e s s a g e
  // _ m e ?" after the m. Each letter is a flex item; when game mode is
  // active the original t/h/r/e/e/a/m collapse (opacity 0, max-width 0)
  // so the "s" slides to the start, then the n/a/k/e tail expands.
  // Hover/click on the "m" runs the same trick with the message tail.
  const PRE_LETTERS = ['t', 'h', 'r', 'e', 'e'];
  // the "a" between s and m is its own span: hovering it morphs the glyph
  // into the alien, and a click starts space invaders (homepage only)
  const SNAKE_TAIL = ['n', 'a', 'k', 'e'];
  const MESSAGE_TAIL = ['e', 's', 's', 'a', 'g', 'e', ' ', 'm', 'e', '?'];
  const active = $derived(gameMode.active);
  // The "threesam → snake" wordmark animation is snake-only; the alien's
  // invaders game has no title sequence.
  const isSnake = $derived(gameMode.active && gameMode.game === 'snake');

  // Click-toggled reveal of the message tail (click only — a hover preview
  // would slide the "m" out from under the cursor and flicker). State lives on
  // messageMode so the homepage can fade the gallery + tagline as the letters
  // fade in, same as the snake game. messageMode.stop() clears it on close, so
  // the wordmark returns to "threesam". No-op while the game is running so the
  // two tails can't both expand at once.
  const toggleMessage = () => {
    if (active) return;
    messageMode.revealing = !messageMode.revealing;
  };
  const mLabel = $derived(messageMode.revealing ? 'hide message me?' : 'show message me?');
</script>

<svelte:element
  this={tag}
  class="wordmark absolute bottom-6 left-6 z-50 flex font-mono text-3xl font-bold tracking-meta {color} md:bottom-8 md:left-8 md:text-4xl"
  class:is-game={isSnake}
  class:show-message={messageClickable && messageMode.revealing && !active}
  class:wordmark-hidden={gameMode.wordmarkSlotOccupied || messageMode.active}
>
  {#each PRE_LETTERS as l, i (`pre-${i}`)}
    <span class="letter">{l}</span>
  {/each}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span
    class="letter s-letter"
    class:clickable={gameClickable && !active}
    onclick={gameClickable ? () => { if (active) { gameMode.stop(); } else { gameMode.start('snake'); } } : undefined}
    role={gameClickable ? 'button' : undefined}
    tabindex={gameClickable ? 0 : undefined}
    onkeydown={gameClickable
      ? (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (active) gameMode.stop();
            else gameMode.start('snake');
          }
        }
      : undefined}
  >s</span>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span
    class="letter a-letter"
    class:clickable={gameClickable && !active}
    role={gameClickable ? 'button' : undefined}
    tabindex={gameClickable ? 0 : undefined}
    aria-label={gameClickable ? 'play space invaders' : undefined}
    onclick={gameClickable
      ? () => {
          if (!gameMode.active) gameMode.start('invaders');
        }
      : undefined}
    onkeydown={gameClickable
      ? (e: KeyboardEvent) => {
          if ((e.key === 'Enter' || e.key === ' ') && !gameMode.active) {
            e.preventDefault();
            gameMode.start('invaders');
          }
        }
      : undefined}
  ><span class="a-glyph">a</span><span class="a-alien" aria-hidden="true"
      ><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="currentColor"
          d="M16 3c5.7 0 9.5 3.6 9.5 9 0 5.6-4 16-9.5 16S6.5 17.6 6.5 12c0-5.4 3.8-9 9.5-9z"
        />
        <ellipse cx="12" cy="15" rx="2.4" ry="4.2" transform="rotate(-18 12 15)" fill="#e8a317" />
        <ellipse cx="20" cy="15" rx="2.4" ry="4.2" transform="rotate(18 20 15)" fill="#e8a317" />
      </svg></span
    ></span
  >
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span
    class="letter m-letter"
    class:clickable={messageClickable}
    onclick={messageClickable ? toggleMessage : undefined}
    role={messageClickable ? 'button' : undefined}
    tabindex={messageClickable ? 0 : undefined}
    aria-label={messageClickable ? mLabel : undefined}
    onkeydown={messageClickable
      ? (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMessage();
          }
        }
      : undefined}
  >m</span>
  {#each SNAKE_TAIL as l, i (`tail-${i}`)}
    <span class="tail" style:--tail-delay="{200 + i * 130}ms">{l}</span>
  {/each}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- Single delegated handler for the whole message tail. `display:
       contents` keeps the inner spans as direct flex children of the
       wordmark; clicks on any letter bubble here. Letters are
       individually unclickable when collapsed (max-width: 0 → no
       hitbox), so the wrapper only fires when something is visible. -->
  <span
    class="msg-tail-group"
    class:clickable={messageClickable}
    onclick={messageClickable ? () => { messageMode.start(); } : undefined}
  >
    {#each MESSAGE_TAIL as l, i (`msg-${i}`)}
      <span class="msg-tail" style:--msg-delay="{100 + i * 80}ms">{l}</span>
    {/each}
  </span>
</svelte:element>
<!-- Tagline (anchored bottom-right). Fades out alongside the gallery
     during snake game or "message me?" letter mode so the active
     experience reads as the only content. -->
<p
  class="tagline absolute right-6 bottom-6 z-10 text-right font-mono text-sm leading-tight tracking-hero {color} md:right-8 md:bottom-8 md:text-base"
  class:tagline-hidden={active || messageMode.active || (messageClickable && messageMode.revealing)}
><span class="block md:inline">certainly</span><a
      class="diver"
      href="https://pyredivers.com/?dive"
      aria-label="dive into pyre divers"
    ><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none">
        <circle cx="16" cy="7" r="3.4" />
        <path d="M16 10.5 L16 20 M16 13 L9 17 M16 13 L23 17 M16 20 L11 27 M16 20 L21 27" />
      </g>
    </svg></a><span class="block md:ml-[0.4em] md:inline">uncertain</span>
</p>

<style>
  .wordmark {
    align-items: baseline;
  }
  .letter,
  .tail,
  .msg-tail {
    display: inline-block;
    overflow: hidden;
    white-space: pre;
    transition:
      max-width 450ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 350ms ease-out;
    max-width: 1em;
    opacity: 1;
  }
  /* Trailing snake + message letters start collapsed and silent. */
  .tail,
  .msg-tail {
    max-width: 0;
    opacity: 0;
    transition-delay: 0ms;
  }
  .msg-tail-group {
    display: contents;
  }
  .s-letter.clickable,
  .m-letter.clickable,
  .msg-tail-group.clickable .msg-tail {
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

     The "m" intentionally has NO hover preview at all: revealing "message me?"
     always collapses the letters before it, sliding the m out from under the
     cursor, so it stays click-only. */
  @media (hover: hover) {
    .wordmark:has(.s-letter.clickable:hover) .letter:not(.s-letter),
    .wordmark:has(.s-letter.clickable:focus-visible) .letter:not(.s-letter) {
      opacity: 0;
    }
  }
  /* PERSISTENT MESSAGE REVEAL — click-toggled (primary path on touch where
     :hover never fires, and a stickier alternative on desktop). */
  .show-message .letter:not(.m-letter) {
    max-width: 0;
    opacity: 0;
  }
  .show-message .msg-tail {
    max-width: 1em;
    opacity: 1;
    transition-delay: var(--msg-delay, 0ms);
  }
  /* The diver in the tagline is the door to pyredivers.com — ?dive tells
     the far side to open on our marigold and run the arrival sequence, so
     the hop reads as one scene. Reveal mechanics inherited from the old
     alien gag (#215); the alien itself now lives in the wordmark's "a". */
  .diver {
    display: none;
    vertical-align: middle;
    width: 0;
    opacity: 0;
    overflow: hidden;
    cursor: pointer;
    color: inherit;
    transition:
      width 450ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 450ms ease-out;
  }
  .diver :global(svg) {
    width: 1.4em;
    height: 1.4em;
    display: block;
  }
  @media (min-width: 768px) {
    .diver {
      display: inline-block;
    }
    .tagline:hover .diver,
    .tagline:focus-within .diver {
      width: 1.6em;
      opacity: 1;
    }
  }
  /* The "a" that is sometimes an alien: hover/focus crossfades the glyph
     to the invader (homepage only — gameClickable gates the handlers). */
  .a-letter {
    position: relative;
  }
  .a-letter.clickable {
    cursor: pointer;
  }
  .a-glyph {
    transition: opacity 200ms ease-out;
  }
  .a-alien {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }
  .a-alien :global(svg) {
    width: 0.85em;
    height: 0.85em;
    display: block;
  }
  .a-letter.clickable:focus-visible .a-glyph {
    opacity: 0;
  }
  .a-letter.clickable:focus-visible .a-alien {
    opacity: 1;
  }
  @media (hover: hover) {
    .a-letter.clickable:hover .a-glyph {
      opacity: 0;
    }
    .a-letter.clickable:hover .a-alien {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .letter,
    .tail,
    .msg-tail,
    .diver,
    .a-glyph,
    .a-alien {
      transition: none;
    }
  }
</style>
