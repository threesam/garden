<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<!--
  A singular piece of work. Wraps Mood → Thoughts → Vision in order.
  Each page composes its own Canvas with unique slot components.
-->
<article class="min-h-screen">
  {@render children?.()}
</article>
