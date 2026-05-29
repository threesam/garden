<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import type { PageData } from "./$types";
  import type { Song } from "$lib/sounds/types";

  let { data }: { data: PageData } = $props();
  let { manifest } = $derived(data);
</script>

<SeoHead
  title="sounds"
  description="music — demos and scores."
  canonical="/sounds"
  schema={collectionPageNode({ path: "/sounds", name: "sounds — threesam" })}
/>

{#snippet song(s: Song)}
  <article style="margin:1rem 0;">
    <div style="display:flex; gap:0.75rem; align-items:flex-start;">
      {#if s.cover}
        <img src={s.cover} alt={s.title} width="64" height="64" loading="lazy" style="display:block;" />
      {:else}
        <div style="width:64px;height:64px;display:grid;place-items:center;background:var(--black);color:var(--coin);font-family:monospace;font-size:1.5rem;border:1px solid var(--coin);">?</div>
      {/if}
      <div style="flex:1; min-width:0;">
        <h4 style="margin:0;">{s.title}{#if s.untitled}<span style="opacity:0.5"> (untitled)</span>{/if}</h4>
        {#each s.versions as v (v.src)}
          <div style="margin:0.25rem 0;">
            <small style="font-family:monospace;opacity:0.7;">{v.date} · {v.variant}{#if v.lossy} · 128k{/if}</small>
            <audio controls preload="none" src={v.src} style="display:block;width:100%;max-width:24rem;"></audio>
          </div>
        {/each}
      </div>
    </div>
  </article>
{/snippet}

<main style="background:var(--black); color:var(--white); min-height:100dvh; padding:2rem; max-width:48rem; margin:0 auto;">
  <h1 class="font-mono uppercase" style="letter-spacing:0.2em;">sounds</h1>

  <h2 class="font-mono uppercase">demos</h2>
  {#each manifest.demos.eps as ep (ep.id)}
    <h3 class="font-mono uppercase" style="opacity:0.8;">{ep.label}</h3>
    {#each ep.songs as s (s.slug)}{@render song(s)}{/each}
  {/each}
  {#each manifest.demos.singles as s (s.slug)}{@render song(s)}{/each}

  <h2 class="font-mono uppercase" style="margin-top:2rem;">scores</h2>
  <h3 class="font-mono uppercase" style="opacity:0.8;">HMBM</h3>
  <ol style="font-family:monospace;">
    {#each manifest.scores.hmbm as cue (cue.src)}
      <li>
        <span>{cue.timecode}</span>
        <audio controls preload="none" src={cue.src} style="display:block;width:100%;max-width:24rem;margin:0.25rem 0;"></audio>
      </li>
    {/each}
  </ol>
  {#each manifest.scores.skw as s (s.slug)}{@render song(s)}{/each}
</main>
