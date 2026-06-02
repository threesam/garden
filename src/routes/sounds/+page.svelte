<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import EyeOcean from "$lib/sounds/EyeOcean.svelte";
  import PlayGlyph from "$lib/sounds/PlayGlyph.svelte";
  import { player, attach, playTrack, toggle, seek, setScrubbing } from "$lib/sounds/player.svelte";
  import type { PageData } from "./$types";
  import type { Cue, Song } from "$lib/sounds/types";

  let { data }: { data: PageData } = $props();
  let { manifest, base } = $derived(data);

  let audioEl = $state<HTMLAudioElement>();
  $effect(() => {
    if (audioEl) attach(audioEl);
  });

  // Keep the screen awake while a track plays (handy on mobile). Re-acquires on
  // tab return; the lock drops automatically when playback stops.
  $effect(() => {
    if (!player.playing) return;
    const api = (
      navigator as Navigator & {
        wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> };
      }
    ).wakeLock;
    if (!api) return;
    let lock: { release(): Promise<void> } | null = null;
    let active = true;
    const acquire = async () => {
      if (lock) return; // already holding one — don't orphan it with a second
      try {
        const next = await api.request("screen");
        if (active) lock = next;
        else await next.release().catch(() => {}); // released during the await
      } catch {
        // denied (tab not visible / insecure context) — ignore
      }
    };
    const onVisible = () => {
      if (active && document.visibilityState === "visible") acquire();
    };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  });

  // viewport point the backdrop eyes gaze toward — the playing song's card center
  let gaze = $state<{ x: number; y: number } | null>(null);

  const url = (p: string) => base + p; // manifest path → R2 origin (prod) / static (dev)
  // the ingest leaves a trailing "–null" end on the last HMBM cue's timecode
  const cueTime = (tc: string) => tc.replace(/[-–]null$/, "");

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
  // Order: 404 pinned at the top (the featured tiles); then the singles, newest
  // first; then the non-404 EPs (fa11faster) — deliberately below the singles
  // despite their recent file dates (re-recordings of older material); scores last.
  let tiles: Tile[] = $derived.by(() => {
    const demo = (song: Song, credit: string | null): Tile => ({ song, kind: "demo", credit, cover: song.cover });
    const byLatest = (a: Tile, b: Tile) => b.song.latest.localeCompare(a.song.latest); // newest first
    const pinned = manifest.demos.eps.find((e) => e.label === "404");
    const pinnedTiles = pinned ? pinned.songs.map((s) => demo(s, pinned.label)) : [];
    const singles = manifest.demos.singles.map((s) => demo(s, null)).sort(byLatest);
    const otherEps = manifest.demos.eps
      .filter((e) => e.label !== "404")
      .flatMap((e) => e.songs.map((s) => demo(s, e.label)))
      .sort(byLatest);
    const scores = manifest.scores.skw.map(
      (s): Tile => ({ song: s, kind: "score", credit: "sk+w", cover: SCORE_POSTER[s.slug] ?? s.cover }),
    );
    return [...pinnedTiles, ...singles, ...otherEps, ...scores];
  });

  // Pause/resume the current track (logs the umami event). A fresh play of a
  // different track goes through play/playCue below.
  const toggleCurrent = async () => {
    const t = player.track;
    const wasPlaying = player.playing;
    if (wasPlaying) {
      trackEvent("sounds-pause", { slug: t?.slug ?? "", variant: t?.variant ?? "" });
    }
    await toggle();
    // only log a resume that actually started (el.play() can be blocked/interrupted)
    if (!wasPlaying && player.playing) {
      trackEvent("sounds-resume", { slug: t?.slug ?? "", variant: t?.variant ?? "" });
    }
  };

  const play = (song: Song) => {
    const v = song.versions[0];
    const src = url(v.src);
    if (player.track?.src === src) {
      toggleCurrent(); // clicking the current card toggles it, not a fresh play
      return;
    }
    trackEvent("sounds-play", { slug: song.slug, variant: v.variant });
    playTrack({ src, title: song.title, variant: v.variant, slug: song.slug });
  };

  const playCue = (cue: Cue) => {
    const src = url(cue.src);
    if (player.track?.src === src) {
      toggleCurrent();
      return;
    }
    const tc = cueTime(cue.timecode);
    trackEvent("sounds-play", { slug: "hmbm", variant: tc });
    playTrack({ src, title: `how many blind mice? ${tc}`, variant: "cue", slug: cue.src });
  };

  // Auto-advance when a track ends: the next grid song, or the next HMBM cue —
  // each list advances within itself and stops at its end (no grid→cue bridge).
  const playNext = () => {
    const cur = player.track;
    if (!cur) return;
    trackEvent("sounds-complete", { slug: cur.slug, variant: cur.variant });
    const ti = tiles.findIndex((t) => t.song.slug === cur.slug);
    if (ti >= 0) {
      const nextTile = tiles[ti + 1];
      if (nextTile) {
        play(nextTile.song);
        return;
      }
    }
    const cues = manifest.scores.hmbm;
    const ci = cues.findIndex((c) => c.src === cur.slug);
    if (ci >= 0) {
      const nextCue = cues[ci + 1];
      if (nextCue) {
        playCue(nextCue);
        return;
      }
    }
    player.playing = false; // reached the end of the list
    player.loading = false;
  };

  const isCurrent = (song: Song) => player.track?.slug === song.slug;

  // "Modal" = a grid song is playing → the other cards recede to nothing and a
  // full-screen catcher lets a click anywhere pause. Cues (no card) don't engage it.
  const modal = $derived(player.playing && player.track?.variant !== "cue");
  // Resolve the three-state glyph. Only the active track shows loading/pause.
  const status = (): "play" | "loading" | "playing" => {
    if (player.loading) return "loading";
    if (player.playing) return "playing";
    return "play";
  };
  const tileStatus = (slug: string) => (player.track?.slug === slug ? status() : "play");

  // The fullscreen eyes gaze toward the playing song's card. Recompute its viewport
  // center on play/pause/track-change and on scroll/resize — one layout read, not
  // per animation frame. null when nothing in the grid is playing (a paused track,
  // or an HMBM cue, which has no card), so the eyes relax to idle drift.
  const updateGaze = () => {
    const slug = player.playing ? player.track?.slug : undefined;
    const el = slug ? document.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`) : null;
    if (!el) {
      gaze = null;
      return;
    }
    const r = el.getBoundingClientRect();
    gaze = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  $effect(() => {
    void player.track?.slug; // re-aim when the track or play state changes
    void player.playing;
    updateGaze();
  });
  $effect(() => {
    // also re-aim when the page reflows (late covers/posters/web font) with no
    // scroll or resize event to catch it
    const ro = new ResizeObserver(updateGaze);
    ro.observe(document.body);
    return () => ro.disconnect();
  });

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

<svelte:window onscroll={updateGaze} onresize={updateGaze} />

<EyeOcean {gaze} playing={player.playing} />
<!-- Edge scrims: two stacked gradients (cream + dark), opacity-crossfaded
     on `playing`. Same 600ms timeline as the EyeOcean bg lerp. -->
<div class="scrim scrim-top scrim-cream" class:playing={player.playing} aria-hidden="true"></div>
<div class="scrim scrim-top scrim-dark" class:playing={player.playing} aria-hidden="true"></div>
<h1 class="brand" class:playing={player.playing}>sounds</h1>

{#snippet tile(t: Tile, featured: boolean)}
  {@const song = t.song}
  {@const active = isCurrent(song) && player.playing}
  {@const loading = isCurrent(song) && player.loading}
  {@const dimmed = modal && !active}
  <figure class="stack" class:playing={active} class:loading class:dimmed inert={dimmed} data-slug={song.slug}>
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
        <span class="disc"><PlayGlyph state={tileStatus(song.slug)} /></span>
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

  <section class="hmbm" class:hushed={modal} inert={modal}>
    <h2 class="hmbm-title">{HMBM_FILM.title}</h2>
    <p class="hmbm-meta">sk+w · film score · {HMBM_FILM.year} · {manifest.scores.hmbm.length} cues</p>
    <div class="hmbm-poster">
      <span class="hmbm-poster-ph" aria-hidden="true">?</span>
      {#if HMBM_FILM.poster}
        <img src={url(HMBM_FILM.poster)} alt="how many blind mice? — film poster" onerror={imgErr} />
      {/if}
      <span class="badge badge-score">score</span>
      <div class="cue-list">
        {#each manifest.scores.hmbm as cue (cue.src)}
          <button
            class="cue-chip"
            class:on={player.track?.src === url(cue.src) && player.playing}
            onclick={() => playCue(cue)}
          >▸ {cueTime(cue.timecode)}</button>
        {/each}
      </div>
    </div>
  </section>

  <!-- while a grid song plays, a click anywhere pauses it (and brings the cards
       back); the playing card + transport sit above this catcher and keep working -->
  {#if modal}
    <button class="pause-catch" aria-label="pause and show all tracks" onclick={toggleCurrent}></button>
  {/if}
</main>

<div class="scrim scrim-bottom scrim-cream" class:playing={player.playing} aria-hidden="true"></div>
<div class="scrim scrim-bottom scrim-dark" class:playing={player.playing} aria-hidden="true"></div>

<footer class="transport" class:playing={player.playing}>
  <button class="tp-play" aria-label={player.playing ? "pause" : "play"} onclick={toggleCurrent} disabled={!player.track}>
    <PlayGlyph state={status()} />
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
    onpointerdown={() => setScrubbing(true)}
    onpointerup={() => setScrubbing(false)}
    onpointercancel={() => setScrubbing(false)}
    aria-label="seek"
  />
  <span class="t">{fmt(player.duration)}</span>
</footer>

<audio bind:this={audioEl} crossorigin="anonymous" src={player.track?.src ?? ""} onended={playNext}></audio>

<style>
  :global(body) {
    background: var(--black);
  }

  main {
    --player-h: 66px;
    /* dark backing that hugs caption text for WCAG contrast over the eye-ocean */
    --caption-scrim: rgba(0, 0, 0, 0.9);
    position: relative;
    z-index: 1;
    max-width: 1600px;
    margin: 0 auto;
    padding: 7rem 1.5rem calc(var(--player-h) + 6rem);
    color: var(--white);
    font-family: "Recursive Mono", ui-monospace, monospace;
    /* the fanned dub-stack cards rotate past the edge columns; clip that off-screen
       overhang so it can't spawn a horizontal scrollbar. `clip` (not `hidden`) so
       main doesn't become a scroll container — overflow-y stays visible. */
    overflow-x: clip;
  }
  /* title pinned top-left, inline with the nav coin. Color crossfades
     with the EyeOcean's cream<->black bg: dark text at idle, cream text
     while playing — same 600ms ramp as the bg lerp inside EyeOcean. */
  .brand {
    position: fixed;
    top: 1.25rem;
    left: 1.6rem;
    z-index: 10;
    margin: 0;
    height: 40px; /* match the 40px nav coin */
    display: flex;
    align-items: center; /* center the title on the coin's vertical midline */
    font-family: "Recursive Mono", ui-monospace, monospace;
    font-size: clamp(1rem, 2vw, 1.4rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: var(--black);
    transition: color 600ms linear;
  }
  .brand.playing {
    color: var(--white);
  }
  @media (min-width: 768px) {
    .brand {
      top: 1.5rem; /* match the coin's md:top-6 so they stay aligned on desktop */
    }
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
    transition: opacity 0.45s ease;
  }
  .grid > :global(.stack:nth-child(-n + 3)) {
    grid-column: span 4;
  }
  /* once a grid song is actually playing, every other card recedes to nothing so
     only the playing one (and the eyes watching it) remain. Computed per-tile so
     it tracks playback start; a click anywhere then pauses + brings them back. */
  .grid > :global(.stack.dimmed) {
    opacity: 0;
    pointer-events: none;
  }
  /* lift the playing card above the full-screen pause-catcher so it stays crisp
     and its own pause button keeps working */
  .grid > :global(.stack.playing) {
    position: relative;
    z-index: 25;
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
    border: 1px solid rgba(245, 244, 240, 0.16);
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
  /* covers sit in grayscale, bloom to color on hover (and while loading/playing) */
  .stack:hover .card img,
  .stack.loading .card img,
  .stack.playing .card img {
    filter: grayscale(0);
  }
  /* coin ring hugging the playing card — on the top card itself, so the outline
     follows its 8px radius, tracks its transform, and isn't clipped: wraps
     precisely with no gap. The fanned cards peek out behind it. */
  .stack.playing .deck > .card:first-child {
    outline: 2px solid var(--coin);
    outline-offset: 0;
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
    border: 1px solid rgba(245, 244, 240, 0.4);
  }
  .badge-score {
    color: var(--black);
    background: var(--coin);
  }

  /* the whole cover is the play/pause target — the click area is the full image,
     not just the disc; the visible coin disc is an inner element */
  .play {
    position: absolute;
    inset: 0;
    border: 0;
    padding: 0;
    background: transparent;
    display: grid;
    place-items: center;
    cursor: pointer;
    z-index: 50;
  }
  .play .disc {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--coin);
    color: var(--black);
    font-size: 1.4rem; /* drives the glyph size (in em) */
    display: grid;
    place-items: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.22s, transform 0.22s;
  }
  /* the disc (affordance) reveals on hover / loading / playing; the full-cover
     button stays clickable regardless */
  .stack:hover .play .disc,
  .stack.loading .play .disc,
  .stack.playing .play .disc {
    opacity: 1;
    transform: scale(1);
  }
  /* On desktop, the playing card's pause disc hides until you hover the cover —
     the modal stays a clean cover (+ coin ring). The loading swirl still shows,
     and touch devices keep it visible. The full-cover target still pauses either way. */
  @media (hover: hover) {
    .stack.playing:not(.loading):not(:hover) .play .disc {
      opacity: 0;
    }
  }

  figcaption {
    margin-top: 0.9rem;
    position: relative;
    z-index: 60; /* keep titles above neighbouring tiles' fanned/hovered cards */
  }
  /* Titles read as headings. They sit over the eye-ocean (black→cream),
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

  /* HMBM film score — heading, then the poster with the cue slider over its base */
  .hmbm {
    margin-top: 4.5rem;
    border-top: 1px solid rgba(245, 244, 240, 0.12);
    padding-top: 2rem;
    transition: opacity 0.45s ease;
  }
  /* recede with the grid while a song plays — focus stays on the one playing card */
  .hmbm.hushed {
    opacity: 0;
    pointer-events: none;
  }

  /* full-screen click target shown while a grid song plays: a click anywhere
     pauses (and the cards return). Inside <main> (z-index 1) so the playing card
     (z-index 25) sits above it; the transport (z-index 30, outside main) stays
     clickable so the scrubber doesn't trigger a pause. */
  .pause-catch {
    position: fixed;
    inset: 0;
    z-index: 20;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .hmbm-poster {
    position: relative;
    width: 100%;
    max-width: 460px; /* desktop: a prominent poster, not full-bleed */
    aspect-ratio: 4 / 5;
    border-radius: 10px;
    overflow: hidden;
    margin: 0.4rem 0 0;
    border: 1px solid rgba(245, 244, 240, 0.16);
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
  /* cue slider — one row over the bottom of the poster, horizontally scrollable */
  .cue-list {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 2rem 0.7rem 0.7rem; /* top pad lets the gradient fade the chips in */
    background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 40%, transparent);
    scrollbar-width: thin;
    scrollbar-color: var(--coin) transparent;
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

  /* Edge scrims — two stacked gradients per edge (cream + dark) that
     opacity-crossfade with `.playing`. Same 600ms timeline as the bg
     lerp inside EyeOcean. Each gradient is static; we transition the
     opacity, which animates reliably across browsers (transitioning
     between two different linear-gradient values doesn't). */
  .scrim {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 5;
    pointer-events: none;
    transition: opacity 600ms linear;
  }
  .scrim-top {
    top: 0;
    height: 7rem;
  }
  .scrim-bottom {
    bottom: 0;
    height: 12rem;
  }
  /* Desktop: cap the fades at nav height — the long gradient tails
     read as too heavy at wider viewports. */
  @media (min-width: 768px) {
    .scrim-top,
    .scrim-bottom {
      height: 2.5rem;
    }
  }
  .scrim-cream.scrim-top {
    background: linear-gradient(to bottom, var(--white) 2.5rem, transparent);
    opacity: 1;
  }
  .scrim-cream.scrim-bottom {
    background: linear-gradient(to top, var(--white) 66px, transparent);
    opacity: 1;
  }
  .scrim-cream.playing {
    opacity: 0;
  }
  .scrim-dark.scrim-top {
    background: linear-gradient(to bottom, var(--black) 2.5rem, transparent);
    opacity: 0;
  }
  .scrim-dark.scrim-bottom {
    background: linear-gradient(to top, var(--black) 66px, transparent);
    opacity: 0;
  }
  .scrim-dark.playing {
    opacity: 1;
  }

  /* fixed transport. Background + text colors crossfade with the bg —
     cream-tinted scrim + dark text at idle, black scrim + cream text
     while playing. Same 600ms ramp as the EyeOcean bg lerp. */
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
    background: rgba(245, 244, 240, 0.66); /* --white at 0.66 */
    backdrop-filter: blur(10px);
    border-top: 1px solid color-mix(in srgb, var(--coin) 35%, transparent);
    color: var(--black);
    font-family: "Recursive Mono", ui-monospace, monospace;
    transition:
      background 600ms linear,
      color 600ms linear;
  }
  .transport.playing {
    background: rgba(0, 0, 0, 0.66);
    color: var(--white);
  }
  .tp-play {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--coin);
    color: var(--black);
    font-size: 1.1rem; /* drives the glyph size (in em) */
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .tp-play:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .np {
    flex: 0 1 auto; /* may shrink (title ellipsis) so the scrubber keeps room */
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
    min-width: 0; /* override the range input's intrinsic min so it can shrink */
    accent-color: var(--coin);
    height: 4px;
  }

  @media (max-width: 640px) {
    main {
      padding: 7rem 1rem calc(var(--player-h) + 5rem);
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
    .transport {
      gap: 0.6rem;
      padding: 0.6rem 0.9rem;
    }
    .t {
      font-size: 0.68rem;
    }
    .hmbm-poster {
      max-width: none; /* full-span on phones */
    }
    .hmbm-poster img {
      filter: none; /* no hover on touch — show the poster in colour */
    }
  }

  audio {
    display: none;
  }
</style>
