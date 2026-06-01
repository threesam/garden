<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<!--
  The feeling before the words. A generated visual world that sets the emotional
  tone of the piece. Holds the title — the name of the thing. Nothing else competes.
-->
<section class="relative flex h-dvh w-full items-end overflow-hidden">
  {#if children}
    <!-- Sketch / visual layer — passed as children -->
    <div class="absolute inset-0">
      {@render children()}
    </div>
  {/if}

  <!-- Title — anchored to the bottom, floating over the visual -->
  <h1 class="relative z-10 px-6 pb-12 font-mono text-sm tracking-hero text-foreground/70 md:px-9 md:pb-18 md:text-base">
    {title}
  </h1>
</section>
