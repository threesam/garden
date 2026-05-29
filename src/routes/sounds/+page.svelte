<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { manifest } = $derived(data);
</script>

<SeoHead title="sounds" description="music — demos and scores." canonical="/sounds" />

<main style="background:var(--black); color:var(--white); min-height:100dvh; padding:2rem;">
  <h1 class="font-mono uppercase">sounds</h1>

  <section>
    <h2 class="font-mono uppercase">demos</h2>
    {#each manifest.demos.eps as ep (ep.id)}
      <h3>{ep.label}</h3>
    {/each}
    {#if manifest.demos.singles.length === 0 && manifest.demos.eps.length === 0}
      <p>no tracks yet — run the ingest.</p>
    {/if}
  </section>

  <section>
    <h2 class="font-mono uppercase">scores</h2>
  </section>
</main>
