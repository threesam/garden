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
<!-- Mobile: stacked above the wordmark (both left) so the two never collide on
     narrow screens. md+: spread to the opposite bottom corner. -->
<p
  class="absolute bottom-16 left-6 z-10 font-mono text-sm tracking-hero {color} md:bottom-8 md:left-auto md:right-8 md:text-base"
>
  certainly uncertain
</p>
