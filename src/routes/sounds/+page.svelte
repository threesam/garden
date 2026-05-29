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

  // umami custom events — "what gets played". The umami script is loaded
  // site-wide in +layout.svelte; no-op (via ?.) during SSR / if it's blocked.
  const trackEvent = (name: string, data: Record<string, string | number>) =>
    (globalThis as { umami?: { track?: (n: string, d?: unknown) => void } }).umami?.track?.(name, data);

  // fan tilt per version index (0 = newest, on top, flat)
  const fan = (i: number) => (i === 0 ? 0 : (i % 2 ? -1 : 1) * (4 + i * 1.6));

  const play = (song: Song) => {
    const v = song.versions[0];
    trackEvent("sounds-play", { slug: song.slug, variant: v.variant });
    playTrack({ src: url(v.src), title: song.title, variant: v.variant, slug: song.slug });
  };

  const isCurrent = (song: Song) => player.track?.slug === song.slug;

  const fmt = (s: number) => {
    if (!s || !Number.isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  // One flowing grid of demo tiles; the 404 EP's 3 tiles lead (featured), the rest follow.
  let demos = $derived([...manifest.demos.eps.flatMap((e) => e.songs), ...manifest.demos.singles]);
</script>

<SeoHead
  title="sounds"
  description="music — demos and scores."
  canonical="/sounds"
  schema={collectionPageNode({ path: "/sounds", name: "sounds — threesam" })}
/>

<EyeOcean />
<div class="scrim scrim-top" aria-hidden="true"></div>

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
  <h1>sounds</h1>

  <section class="grid">
    {#each demos as s (s.slug)}{@render stack(s)}{/each}
  </section>

  <section class="scores">
    <h2>scores</h2>
    <h3>HMBM <span class="dim">· {manifest.scores.hmbm.length} cues</span></h3>
    <ol class="cues">
      {#each manifest.scores.hmbm as cue (cue.src)}
        <li>
          <button
            class="cue"
            class:on={player.track?.src === url(cue.src) && player.playing}
            onclick={() => { trackEvent("sounds-play", { slug: "hmbm", variant: cue.timecode }); playTrack({ src: url(cue.src), title: `HMBM ${cue.timecode}`, variant: "cue", slug: cue.src }); }}
          >▸ {cue.timecode}</button>
        </li>
      {/each}
    </ol>
    {#if manifest.scores.skw.length}
      <h3>sk+w</h3>
      <div class="grid skw">{#each manifest.scores.skw as s (s.slug)}{@render stack(s)}{/each}</div>
    {/if}
  </section>
</main>

<div class="scrim scrim-bottom" aria-hidden="true"></div>

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

<audio bind:this={audioEl} crossorigin="anonymous" src={player.track?.src ?? ""} onended={onEnded}></audio>

<style>
  :global(body) {
    background: var(--black);
  }

  main {
    --player-h: 66px;
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 4.5rem 1.5rem calc(var(--player-h) + 3rem);
    color: var(--white);
    font-family: "Recursive Mono", ui-monospace, monospace;
  }
  h1 {
    margin: 0 0 2rem;
    font-size: clamp(1.2rem, 2.4vw, 1.8rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    text-shadow: 0 1px 14px rgba(0, 0, 0, 0.85);
  }

  /* 12-col grid: first 3 tiles span 4 (3-across), the rest span 3 (4-across) */
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 2rem 1.5rem;
    align-items: start;
  }
  .grid > :global(.stack) {
    grid-column: span 3;
  }
  .grid > :global(.stack:nth-child(-n + 3)) {
    grid-column: span 4;
  }

  /* dub-stack tile */
  .stack {
    margin: 0;
    width: 100%;
  }
  .deck {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }
  .card {
    position: absolute;
    inset: 0;
    border-radius: 8px;
    overflow: hidden;
    background: var(--black);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.55);
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
    font-size: 2.6rem;
    color: var(--coin);
  }
  .stack:hover .card {
    transform: rotate(calc(var(--rot) * 1.85)) translateY(-3px);
  }
  .stack.playing .deck::after {
    content: "";
    position: absolute;
    inset: -5px;
    border-radius: 11px;
    border: 2px solid var(--coin);
    pointer-events: none;
  }
  .play {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 52px;
    height: 52px;
    border: 0;
    border-radius: 50%;
    background: var(--coin);
    color: var(--black);
    font-size: 0.95rem;
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
    margin-top: 0.8rem;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
  }
  .dim {
    color: var(--coin);
    opacity: 0.7;
  }

  /* scores */
  .scores {
    margin-top: 4rem;
  }
  .scores h2 {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    margin: 0 0 1.2rem;
  }
  .scores h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    margin: 1.4rem 0 0.8rem;
    opacity: 0.85;
  }
  .cues {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-rows: repeat(7, auto); /* 14 cues → 2 columns of 7 */
    grid-auto-flow: column;
    gap: 0.3rem 1.6rem;
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
  .skw {
    margin-top: 0.5rem;
    max-width: 560px;
  }
  .skw > :global(.stack),
  .skw > :global(.stack:nth-child(-n + 3)) {
    grid-column: span 6; /* sk+w: 2 across */
  }

  /* fixed black scrims — fade the scrolling grid into black at top + above player */
  .scrim {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 5;
    pointer-events: none;
  }
  .scrim-top {
    top: 0;
    height: 20vh;
    background: linear-gradient(to bottom, var(--black) 12%, transparent);
  }
  .scrim-bottom {
    bottom: 66px; /* sits just above the transport */
    height: 22vh;
    background: linear-gradient(to top, var(--black) 14%, transparent);
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
    background: rgba(0, 0, 0, 0.66);
    backdrop-filter: blur(10px);
    border-top: 1px solid color-mix(in srgb, var(--coin) 35%, transparent);
    color: var(--white);
    font-family: "Recursive Mono", ui-monospace, monospace;
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

  @media (max-width: 640px) {
    main {
      padding: 3rem 1rem calc(var(--player-h) + 2rem);
    }
    .grid {
      gap: 1.4rem 1rem;
    }
    .grid > :global(.stack),
    .grid > :global(.stack:nth-child(-n + 3)),
    .skw > :global(.stack) {
      grid-column: span 6; /* 2 across */
    }
    .np {
      min-width: 0;
    }
  }

  audio {
    display: none;
  }
</style>
