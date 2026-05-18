<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<!--
  What the author actually thinks. Long, unhurried writing.
  The center of gravity. Compose with <Breakout> for emphasis
  and inline images woven into the flow.
-->
<section class="mx-auto max-w-2xl px-6 py-24 md:px-9 md:py-36">
  <div class="space-y-9 text-base leading-[1.9] text-foreground/80 md:text-lg md:leading-[2]">
    {@render children()}
  </div>
</section>
