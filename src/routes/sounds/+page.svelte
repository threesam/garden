<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import EyeOcean from "$lib/sounds/EyeOcean.svelte";
  import { player, attach, playTrack, toggle, seek, onEnded } from "$lib/sounds/player.svelte";
  import type { PageData } from "./$types";
  import type { Cue, Song } from "$lib/sounds/types";

  let { data }: { data: PageData } = $props();
  let { manifest, base } = $derived(data);

  let audioEl = $state<HTMLAudioElement>();
  $effect(() => {
    if (audioEl) attach(audioEl);
  });

  const url = (p: string) => base + p; // manifest path → R2 origin (prod) / static (dev)

  // Hide a cover/poster that fails to load so the "?" placeholder behind it shows
  // through (some film posters aren't mirrored to R2 yet).
  const imgErr = (e: Event) => ((e.currentTarget as HTMLElement).style.display = "none");

  // umami custom events — "what gets played". The umami script is loaded
  // site-wide in +layout.svelte; no-op (via ?.) during SSR / if it's blocked.
  const trackEvent = (name: string, data: Record<string, string | number>) =>
    (globalThis as { umami?: { track?: (n: string, d?: unknown) => void } }).umami?.track?.(name, data);

  // Posters for the sk+w film scores + the HMBM film, mirrored from
  // skeletonflowersandwater.com (Skeleton Flowers + Water) to R2.
  const SCORE_POSTER: Record<string, string> = {
    "quintessentially-unaware": "/audio/sounds/covers/quintessentially-unaware.jpg",
    "polka-dot-dress": "/audio/sounds/covers/polka-dot-dress.jpg",
  };
  const HMBM_FILM = {
    title: "how many blind mice?",
    year: "2024",
    poster: "/audio/sounds/covers/how-many-blind-mice.jpg",
  };

  // fan tilt per version index (0 = newest, on top, flat)
  const fan = (i: number) => {
    if (i === 0) return 0;
    const dir = i % 2 ? -1 : 1; // alternate left/right
    return dir * (4 + i * 1.6);
  };

  // One flowing grid of tiles — each tagged demo|score with an optional credit
  // shown under the title (the EP/band name for demos, the studio for scores).
  type Kind = "demo" | "score";
  interface Tile {
    song: Song;
    kind: Kind;
    credit: string | null;
    cover: string | null;
  }
  let tiles = $derived<Tile[]>([
    ...manifest.demos.eps.flatMap((e) =>
      e.songs.map((song) => ({ song, kind: "demo" as const, credit: e.label, cover: song.cover })),
    ),
    ...manifest.demos.singles.map((song) => ({ song, kind: "demo" as const, credit: null, cover: song.cover })),
    ...manifest.scores.skw.map((song) => ({
      song,
      kind: "score" as const,
      credit: "sk+w",
      cover: SCORE_POSTER[song.slug] ?? song.cover,
    })),
  ]);

  const play = (song: Song) => {
    const v = song.versions[0];
    trackEvent("sounds-play", { slug: song.slug, variant: v.variant });
    playTrack({ src: url(v.src), title: song.title, variant: v.variant, slug: song.slug });
  };

  const playCue = (cue: Cue) => {
    trackEvent("sounds-play", { slug: "hmbm", variant: cue.timecode });
    playTrack({ src: url(cue.src), title: `how many blind mice? ${cue.timecode}`, variant: "cue", slug: cue.src });
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
<div class="scrim scrim-top" aria-hidden="true"></div>
<h1 class="brand">sounds</h1>

{#snippet tile(t: Tile, featured: boolean)}
  {@const song = t.song}
  {@const active = isCurrent(song) && player.playing}
  <figure class="stack" class:playing={active}>
    <div class="deck">
      {#each song.versions as v, i (v.src)}
        <div class="card" style="--rot:{fan(i)}deg; z-index:{40 - i};">
          <span class="ph">?</span>
          {#if t.cover}
            <img src={url(t.cover)} alt="" draggable="false" onerror={imgErr} />
          {/if}
        </div>
      {/each}
      <span class="badge badge-{t.kind}">{t.kind}</span>
      <button
        class="play"
        aria-label={active ? `pause ${song.title}` : `play ${song.title}`}
        onclick={() => play(song)}
      >
        {#if active}❚❚{:else}▶{/if}
      </button>
    </div>
    <figcaption>
      <span class="title" class:featured>{song.title}</span>
      <span class="sub">
        {#if t.credit}<span class="credit">{t.credit}</span>{/if}
        {#if song.versions.length > 1}<span class="vers">{song.versions.length} versions</span>{/if}
      </span>
    </figcaption>
  </figure>
{/snippet}

<main>
  <section class="grid">
    {#each tiles as t, i (t.song.slug)}{@render tile(t, i < 3)}{/each}
  </section>

  <section class="hmbm">
    <div class="hmbm-poster">
      <span class="hmbm-poster-ph" aria-hidden="true">?</span>
      {#if HMBM_FILM.poster}
        <img src={url(HMBM_FILM.poster)} alt="how many blind mice? — film poster" onerror={imgErr} />
      {/if}
      <span class="badge badge-score">score</span>
    </div>
    <h2 class="hmbm-title">{HMBM_FILM.title}</h2>
    <p class="hmbm-meta">sk+w · film score · {HMBM_FILM.year} · {manifest.scores.hmbm.length} cues</p>
    <div class="cue-list">
      {#each manifest.scores.hmbm as cue (cue.src)}
        <button
          class="cue-chip"
          class:on={player.track?.src === url(cue.src) && player.playing}
          onclick={() => playCue(cue)}
        >▸ {cue.timecode}</button>
      {/each}
    </div>
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
    background: #000;
  }

  main {
    --player-h: 66px;
    /* dark backing that hugs caption text for WCAG contrast over the eye-ocean */
    --caption-scrim: rgba(0, 0, 0, 0.9);
    position: relative;
    z-index: 1;
    max-width: 1600px;
    margin: 0 auto;
    padding: 4.5rem 1.5rem calc(var(--player-h) + 3rem);
    color: var(--white);
    font-family: "Recursive Mono", ui-monospace, monospace;
  }
  /* title pinned top-left, inline with the nav coin, above the top scrim */
  .brand {
    position: fixed;
    top: 1.25rem;
    left: 1.6rem;
    z-index: 10;
    margin: 0;
    font-family: "Recursive Mono", ui-monospace, monospace;
    font-size: clamp(1rem, 2vw, 1.4rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: var(--white);
    text-shadow: 0 1px 14px rgba(0, 0, 0, 0.85);
  }

  /* 12-col grid: first 3 tiles span 4 (3-across), the rest span 3 (4-across) */
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 2.4rem 1.5rem;
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
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: grayscale(1);
    transition: filter 0.4s ease;
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
  /* covers sit in grayscale, bloom to color on hover (and while playing) */
  .stack:hover .card img,
  .stack.playing .card img {
    filter: grayscale(0);
  }
  .stack.playing .deck::after {
    content: "";
    position: absolute;
    inset: -5px;
    border-radius: 11px;
    border: 2px solid var(--coin);
    pointer-events: none;
  }

  /* demo / score badge, pinned over the top-left of the cover */
  .badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    z-index: 45;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    pointer-events: none;
  }
  .badge-demo {
    color: var(--white);
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .badge-score {
    color: var(--black);
    background: var(--coin);
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
    margin-top: 0.9rem;
  }
  /* Titles read as headings. They sit over the reactive eye-ocean (black→cream),
     so a dark backing that hugs the text guarantees WCAG contrast regardless of
     what's behind it — same idea as the homepage card-label pills. */
  .title {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.55;
    letter-spacing: 0.01em;
    color: var(--white);
    background: var(--caption-scrim);
    padding: 0.08em 0.4em;
    border-radius: 6px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .title.featured {
    font-size: 1.3rem; /* the featured 404 tiles run a touch larger */
  }
  .sub {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
  }
  /* EP / studio credit + version count — same dark backing for legibility */
  .credit,
  .vers {
    background: var(--caption-scrim);
    padding: 0.2em 0.5em;
    border-radius: 5px;
  }
  .credit {
    color: var(--coin);
    font-weight: 600;
  }
  .vers {
    color: var(--white);
    opacity: 0.7;
  }
  .dim {
    color: var(--coin);
    opacity: 0.7;
  }

  /* HMBM film score — poster snapped right, cues flowing after it */
  .hmbm {
    margin-top: 4.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 2rem;
  }
  .hmbm-poster {
    position: relative;
    float: right;
    width: clamp(160px, 22vw, 260px);
    aspect-ratio: 4 / 5;
    border-radius: 10px;
    overflow: hidden;
    margin: 0 0 1.5rem 2rem;
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    background: var(--black);
  }
  .hmbm-poster img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1);
    transition: filter 0.4s ease;
  }
  .hmbm:hover .hmbm-poster img {
    filter: grayscale(0);
  }
  .hmbm-poster-ph {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 3rem;
    color: var(--coin);
  }
  .hmbm-title {
    display: block;
    width: fit-content; /* hug the text for the backing, but stay block (stacks above meta) */
    margin: 0.6rem 0 0.2rem;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    background: var(--caption-scrim);
    padding: 0.05em 0.4em;
    border-radius: 6px;
  }
  .hmbm-meta {
    display: block;
    width: fit-content; /* hug the text for the backing, but stay block */
    margin: 0 0 1.2rem;
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    color: var(--coin);
    background: var(--caption-scrim);
    padding: 0.2em 0.5em;
    border-radius: 5px;
  }
  .cue-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .cue-chip {
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--coin) 35%, transparent);
    border-radius: 7px;
    background: var(--caption-scrim);
    color: var(--white);
    font: inherit;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
  }
  .cue-chip:hover,
  .cue-chip.on {
    background: var(--coin);
    color: var(--black);
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
    background: linear-gradient(to bottom, #000 12%, transparent);
  }
  .scrim-bottom {
    bottom: 0; /* runs under the transport — no gap above the player */
    height: 30vh;
    background: linear-gradient(to top, #000 70px, transparent);
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
      gap: 1.8rem 1rem;
    }
    .grid > :global(.stack),
    .grid > :global(.stack:nth-child(-n + 3)) {
      grid-column: span 6; /* 2 across */
    }
    .title,
    .title.featured {
      font-size: 1rem;
    }
    .np {
      min-width: 0; /* let now-playing shrink so the scrubber keeps room on phones */
    }
    .hmbm-poster {
      float: none;
      display: block;
      width: 60%;
      max-width: 240px;
      margin: 0 0 1.2rem;
    }
  }

  audio {
    display: none;
  }
</style>
