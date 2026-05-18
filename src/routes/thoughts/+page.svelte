<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import SketchHost from "$lib/components/art/SketchHost.svelte";
</script>

<SeoHead
  title="thoughts"
  description="essays (work in progress)."
  canonical="/thoughts"
/>

<main
  class="relative h-dvh w-full overflow-hidden"
  style="background-color: var(--black);"
>
  <div class="absolute inset-0">
    <SketchHost slug="30" active interactive={false} />
  </div>
  <div class="pointer-events-none absolute inset-0 grid place-items-center">
    <h1
      class="font-mono text-4xl font-bold uppercase tracking-[0.2em] md:text-7xl"
      style="color: var(--white); mix-blend-mode: difference;"
    >
      work in progress
    </h1>
  </div>
</main>
