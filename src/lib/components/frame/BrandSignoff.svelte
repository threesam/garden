<script lang="ts">
  // Bottom-corner brand sign-off: the "threesam" wordmark (bottom-left) and the
  // "certainly uncertain" tagline (bottom-right). Used on the homepage and at
  // the bottom of the Anchor footer so the mark reads the same everywhere.
  //
  // `heading` renders the wordmark as <h1> (the homepage's sole crawlable
  // heading); elsewhere it's a <div>, since those pages already own their <h1>.
  // The parent must be positioned (relative) — the corners anchor to it.
  let { heading = false }: { heading?: boolean } = $props();
  const tag = $derived(heading ? 'h1' : 'div');
</script>

<svelte:element
  this={tag}
  class="absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold tracking-[0.15em] text-[var(--black)] md:bottom-8 md:left-8 md:text-4xl"
>
  threesam
</svelte:element>
<p
  class="absolute right-6 bottom-6 z-10 font-mono text-sm tracking-[0.2em] text-[var(--black)] md:right-8 md:bottom-8 md:text-base"
>
  certainly uncertain
</p>
