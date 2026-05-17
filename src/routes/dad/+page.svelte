<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import Prose from "$lib/components/Prose.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { markdown } = $derived(data);
</script>

<SeoHead
  title="dad"
  description="stories about my dad."
  ogImage="/og/dad.png"
  canonical="/dad"
/>

<main class="min-h-screen bg-zinc-900" style="color: var(--white);">
  <section class="relative h-dvh w-full overflow-hidden bg-zinc-900">
    <!-- Phase 5: LazyMount + AsciiImage srcs={["/assets/dad-1.jpg"]} className="h-full w-full" inverted -->
    <h1
      class="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:bottom-18 md:left-18 md:text-8xl"
      style="color: var(--white);"
    >
      dad
    </h1>
  </section>

  <section class="mx-auto max-w-3xl px-6 pb-24 pt-18 md:px-9 md:pt-36">
    <div class="tier-essay">
      {#if markdown}
        <Prose content={markdown} />
      {:else}
        <p class="font-sans text-base leading-relaxed md:text-2xl md:leading-relaxed">
          more soon.
        </p>
      {/if}
    </div>
  </section>
</main>
