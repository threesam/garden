<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<!--
  A single sentence that breaks out of the flow — bigger, alone, breathing.
  Use sparingly. It earned it.
-->
<p class="my-18 text-2xl leading-snug text-foreground md:my-24 md:text-3xl md:leading-snug">
  {@render children?.()}
</p>
