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
  let { heading = false, tone = 'dark' }: { heading?: boolean; tone?: 'dark' | 'light' } =
    $props();
  const tag = $derived(heading ? 'h1' : 'div');
  const color = $derived(tone === 'light' ? 'text-white' : 'text-black');
</script>

<svelte:element
  this={tag}
  class="absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold tracking-meta {color} md:bottom-8 md:left-8 md:text-4xl"
>
  threesam
</svelte:element>
<!-- Tagline is always anchored bottom-right. Stacks one word per line on
     mobile (where horizontal room is tight); collapses back to a single
     line on md+. On md+ an alien sits between the two words at 0 width
     and fades in on hover, pushing "certainly" leftward as it expands. -->
<p
  class="tagline absolute right-6 bottom-6 z-10 text-right font-mono text-sm leading-tight tracking-hero {color} md:right-8 md:bottom-8 md:text-base"
>
  <span class="block md:inline">certainly</span><span class="alien" aria-hidden="true"
    ><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <!-- Classic gray-alien head: rounded teardrop body, two angled almond
           eyes. Body uses currentColor so it matches the tone prop; eyes
           stay coin so the glyph reads as alien even over dark surrounds. -->
      <path
        fill="currentColor"
        d="M16 3c5.7 0 9.5 3.6 9.5 9 0 5.6-4 16-9.5 16S6.5 17.6 6.5 12c0-5.4 3.8-9 9.5-9z"
      />
      <ellipse cx="12" cy="15" rx="2.4" ry="4.2" transform="rotate(-18 12 15)" fill="#e8a317" />
      <ellipse cx="20" cy="15" rx="2.4" ry="4.2" transform="rotate(18 20 15)" fill="#e8a317" />
    </svg></span><span class="block md:inline">uncertain</span>
</p>

<style>
  /* The alien collapses to zero on rest so the tagline reads as plain text.
     On hover it expands to ~1.4em, opacity ramps from 0→1, sliding "certainly"
     out of the way. Hidden entirely on mobile — the tagline wraps to two
     lines there and the gag is desktop-only. */
  .alien {
    display: none;
    vertical-align: middle;
    width: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      width 450ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 450ms ease-out;
  }
  .alien :global(svg) {
    width: 1.4em;
    height: 1.4em;
    display: block;
  }
  @media (min-width: 768px) {
    .alien {
      display: inline-block;
    }
    .tagline:hover .alien {
      width: 1.6em;
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .alien {
      transition: none;
    }
  }
</style>
