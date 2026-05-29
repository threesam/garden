<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import EyeOcean from "$lib/sounds/EyeOcean.svelte";
  import { player, attach, playTrack, toggle, seek, onEnded } from "$lib/sounds/player.svelte";
  import type { PageData } from "./$types";
  import type { Song } from "$lib/sounds/types";

  let { data }: { data: PageData } = $props();
  let { manifest, base } = $derived(data);

  let audioEl = $state<HTMLAudioElement>();
  $effect(() => {
    if (audioEl) attach(audioEl);
  });

  const url = (p: string) => base + p; // manifest path → R2 origin (prod) / static (dev)

  // fan tilt per version index (0 = newest, on top, flat)
  const fan = (i: number) => (i === 0 ? 0 : (i % 2 ? -1 : 1) * (4 + i * 1.6));

  const play = (song: Song) => {
    const v = song.versions[0];
    playTrack({ src: url(v.src), title: song.title, variant: v.variant, slug: song.slug });
  };

  const isCurrent = (song: Song) => player.track?.slug === song.slug;

  const fmt = (s: number) => {
    if (!s || !Number.isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };
</script>

<SeoHead
  title="sounds"
  description="music — demos and scores."
  canonical="/sounds"
  schema={collectionPageNode({ path: "/sounds", name: "sounds — threesam" })}
/>

<EyeOcean />

{#snippet stack(song: Song)}
  {@const active = isCurrent(song) && player.playing}
  <figure class="stack" class:playing={active}>
    <div class="deck">
      {#each song.versions as v, i (v.src)}
        <div class="card" style="--rot:{fan(i)}deg; z-index:{40 - i};">
          {#if song.cover}
            <img src={url(song.cover)} alt="" draggable="false" />
          {:else}
            <span class="ph">?</span>
          {/if}
        </div>
      {/each}
      <button
        class="play"
        aria-label={active ? `pause ${song.title}` : `play ${song.title}`}
        onclick={() => play(song)}
      >
        {#if active}❚❚{:else}▶{/if}
      </button>
    </div>
    <figcaption>
      {song.title}{#if song.untitled}<span class="dim"> ·untitled</span>{/if}
      {#if song.versions.length > 1}<span class="dim"> ·{song.versions.length}</span>{/if}
    </figcaption>
  </figure>
{/snippet}

<main>
  <header><h1>sounds</h1></header>

  <div class="slider">
    {#each manifest.demos.eps as ep (ep.id)}
      <section class="group ep">
        <h2>{ep.label} <span class="tag">ep · {ep.songs.length}</span></h2>
        <div class="row">{#each ep.songs as s (s.slug)}{@render stack(s)}{/each}</div>
      </section>
    {/each}

    <section class="group">
      <h2>singles <span class="tag">{manifest.demos.singles.length}</span></h2>
      <div class="row">{#each manifest.demos.singles as s (s.slug)}{@render stack(s)}{/each}</div>
    </section>

    <section class="group scores">
      <h2>HMBM <span class="tag">score · {manifest.scores.hmbm.length} cues</span></h2>
      <ol class="cues">
        {#each manifest.scores.hmbm as cue (cue.src)}
          <li>
            <button
              class="cue"
              class:on={player.track?.src === url(cue.src) && player.playing}
              onclick={() => playTrack({ src: url(cue.src), title: `HMBM ${cue.timecode}`, variant: "cue", slug: cue.src })}
            >▸ {cue.timecode}</button>
          </li>
        {/each}
      </ol>
    </section>

    {#if manifest.scores.skw.length}
      <section class="group">
        <h2>sk+w <span class="tag">{manifest.scores.skw.length}</span></h2>
        <div class="row">{#each manifest.scores.skw as s (s.slug)}{@render stack(s)}{/each}</div>
      </section>
    {/if}
  </div>

  <footer class="transport">
    <button class="tp-play" aria-label={player.playing ? "pause" : "play"} onclick={toggle} disabled={!player.track}>
      {#if player.playing}❚❚{:else}▶{/if}
    </button>
    <div class="np">
      {#if player.track}
        <span class="np-title">{player.track.title}</span><span class="dim"> · {player.track.variant}</span>
      {:else}
        <span class="dim">select a track</span>
      {/if}
    </div>
    <span class="t">{fmt(player.currentTime)}</span>
    <input
      class="scrub"
      type="range"
      min="0"
      max={player.duration || 0}
      step="0.1"
      value={player.currentTime}
      oninput={(e) => seek(+e.currentTarget.value)}
      aria-label="seek"
    />
    <span class="t">{fmt(player.duration)}</span>
  </footer>
</main>

<audio bind:this={audioEl} crossorigin="anonymous" src={player.track?.src ?? ""} onended={onEnded}></audio>

<style>
  main {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    color: var(--white);
    font-family: "Recursive Mono", ui-monospace, monospace;
  }
  header {
    padding: 1.5rem 2rem 0;
  }
  h1 {
    margin: 0;
    font-size: clamp(1.1rem, 2vw, 1.6rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: var(--white);
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.8);
  }

  /* horizontal slider through the middle */
  .slider {
    display: flex;
    align-items: center;
    gap: 2.25rem;
    overflow-x: auto;
    overflow-y: visible;
    padding: 2rem 2.5rem 3rem;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    scrollbar-color: var(--coin) transparent;
  }
  .group {
    scroll-snap-align: start;
    flex: 0 0 auto;
  }
  .group h2 {
    margin: 0 0 1rem;
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.9);
  }
  .tag {
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    color: var(--coin);
    opacity: 0.85;
  }
  /* EPs framed like sleeves → clear delineation from singles */
  .group.ep {
    border: 1px solid color-mix(in srgb, var(--coin) 45%, transparent);
    border-radius: 12px;
    padding: 1.1rem 1.3rem 1.3rem;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(3px);
  }
  .row {
    display: flex;
    gap: 1.4rem;
  }

  /* dub-stack */
  .stack {
    margin: 0;
    width: clamp(116px, 13vw, 168px);
    cursor: pointer;
  }
  .deck {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }
  .card {
    position: absolute;
    inset: 0;
    border-radius: 7px;
    overflow: hidden;
    background: var(--black);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
    transform: rotate(var(--rot));
    transform-origin: 50% 90%;
    transition: transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ph {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 2.2rem;
    color: var(--coin);
  }
  /* spread the deck on hover so the stack reads as a stack */
  .stack:hover .card {
    transform: rotate(calc(var(--rot) * 1.85)) translateY(-3px);
  }
  .stack.playing .deck::after {
    content: "";
    position: absolute;
    inset: -5px;
    border-radius: 10px;
    border: 2px solid var(--coin);
    pointer-events: none;
  }
  .play {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 46px;
    height: 46px;
    border: 0;
    border-radius: 50%;
    background: var(--coin);
    color: var(--black);
    font-size: 0.85rem;
    display: grid;
    place-items: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.22s, transform 0.22s;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    z-index: 50;
  }
  .stack:hover .play,
  .stack.playing .play {
    opacity: 1;
    transform: scale(1);
  }
  figcaption {
    margin-top: 0.7rem;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
  }
  .dim {
    color: var(--coin);
    opacity: 0.7;
  }

  /* HMBM cue sheet */
  .scores .cues {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-rows: repeat(7, auto);
    grid-auto-flow: column;
    gap: 0.3rem 1.4rem;
  }
  .cue {
    background: none;
    border: 0;
    color: var(--white);
    font: inherit;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    cursor: pointer;
    padding: 0.15rem 0;
    opacity: 0.78;
    text-align: left;
  }
  .cue:hover,
  .cue.on {
    color: var(--coin);
    opacity: 1;
  }

  /* fixed transport */
  .transport {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    background: rgba(0, 0, 0, 0.62);
    backdrop-filter: blur(10px);
    border-top: 1px solid color-mix(in srgb, var(--coin) 35%, transparent);
  }
  .tp-play {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--coin);
    color: var(--black);
    font-size: 0.8rem;
    cursor: pointer;
  }
  .tp-play:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .np {
    flex: 0 0 auto;
    min-width: 12rem;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .np-title {
    font-weight: 700;
  }
  .t {
    flex: 0 0 auto;
    font-size: 0.72rem;
    color: var(--coin);
    font-variant-numeric: tabular-nums;
  }
  .scrub {
    flex: 1 1 auto;
    accent-color: var(--coin);
    height: 4px;
  }

  audio {
    display: none;
  }
</style>
