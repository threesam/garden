<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import ReadMark from "$lib/components/ReadMark.svelte";
  import Video from "$lib/components/Video.svelte";
  import { articleNode } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  const PUBLISHED = "2026-10-09";
  const POSTER = "/assets/mouth-machine/piece-19-poster.jpg";
  const DESCRIPTION =
    "a 34 second video that started as a voice memo, and the log of every turn it took to get there.";
</script>

<SeoHead
  title="mouth machine"
  description={DESCRIPTION}
  canonical="/thoughts/mouth-machine"
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="a seafoam ring on a black ground"
  preloadImage={POSTER}
  schema={articleNode({
    path: "/thoughts/mouth-machine",
    headline: "mouth machine",
    image: POSTER,
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: "/thoughts/mouth-machine", name: "mouth machine" },
  ]}
/>

<!-- The piece sits above the log and again below it: the thing first, how
     it got made, then the thing again. Only the first one fetches metadata
     up front; the second waits for a tap. -->
{#snippet piece(preload: "metadata" | "none")}
  <Video
    controls
    loop
    playsinline
    {preload}
    src="/assets/mouth-machine/piece-19.mp4"
    poster={POSTER}
    aria-label="mouth machine, piece 19: seafoam shapes on black, guitar over a loop of mouth drums"
    class="mx-auto my-9 block aspect-9/16 w-full max-w-sm rounded-lg bg-black md:my-12"
    tracks={[
      {
        src: "/assets/mouth-machine/piece-19.vtt",
        srclang: "en",
        label: "English",
        kind: "captions",
      },
    ]}
  />
{/snippet}

<main class="min-h-dvh bg-black text-white">
  <article class="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
    <header class="mb-9 md:mb-12">
      <p
        class="mb-4 font-mono text-xs uppercase tracking-section text-coin md:text-sm"
      >
        // log
      </p>
      <h1
        class="font-display text-4xl uppercase tracking-base text-white md:text-6xl"
      >
        mouth machine
      </h1>
      <p class="mt-6 font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
        kept by claude, one entry per turn, while Sam made the video below.
        where it says "this side", that is claude's side.
      </p>
    </header>

    {@render piece("metadata")}

    <div class="log">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- author-authored markdown rendered by our own pipeline -->
      {@html html}
    </div>
    <ReadMark />

    {@render piece("none")}

    <footer class="mt-18 border-t border-zinc-800 pt-9 md:mt-24">
      <a
        href="/thoughts"
        class="font-mono text-xs uppercase tracking-section text-zinc-400 transition-colors hover:text-coin md:text-sm"
      >
        ← all thoughts
      </a>
    </footer>
  </article>
</main>

<style>
  /* A log, not an essay: 45 phases, lists, commands and two tables. The shared
     renderer sizes h2 and p for a short essay and leaves the rest bare, so
     this page sets a denser scale. Unlayered, so it wins over the utility
     classes the renderer puts on the elements. */
  .log :global(h2) {
    margin-top: 4rem;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    line-height: 1.3;
    text-wrap: balance;
  }
  .log :global(h3) {
    margin: 2.25rem 0 0.75rem;
    font-size: 0.8125rem;
    font-variation-settings: "MONO" 1, "CASL" 0, "slnt" 0;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--coin);
  }
  .log :global(p),
  .log :global(li) {
    font-size: 1rem;
    line-height: 1.7;
  }
  .log :global(p) {
    margin-bottom: 1.25rem;
  }
  .log :global(ul),
  .log :global(ol) {
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
  }
  .log :global(ul) {
    list-style: disc;
  }
  .log :global(ol) {
    list-style: decimal;
  }
  .log :global(li) {
    margin-bottom: 0.4rem;
  }
  .log :global(li > ul),
  .log :global(li > ol) {
    margin: 0.4rem 0 0;
  }
  .log :global(li > p) {
    margin-bottom: 0.4rem;
  }
  .log :global(code) {
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
    background: #27272a;
    font-size: 0.875em;
    font-variation-settings: "MONO" 1, "CASL" 0, "slnt" 0;
    overflow-wrap: anywhere;
  }
  .log :global(table) {
    width: 100%;
    margin-bottom: 1.5rem;
    border-collapse: collapse;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .log :global(th),
  .log :global(td) {
    padding: 0.5rem 0.75rem 0.5rem 0;
    border-bottom: 1px solid #27272a;
    text-align: left;
    vertical-align: top;
  }
  /* A commit hash in a cell stays whole, so the column keeps its width. */
  .log :global(td code) {
    overflow-wrap: normal;
    white-space: nowrap;
  }
  .log :global(th) {
    color: #a1a1aa;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    .log :global(h2) {
      margin-top: 5rem;
      font-size: 1.75rem;
    }
    .log :global(p),
    .log :global(li) {
      font-size: 1.125rem;
    }
    .log :global(table) {
      font-size: 1rem;
    }
  }
</style>
