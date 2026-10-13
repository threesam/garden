<script lang="ts">
  import MakingLog from "$lib/components/MakingLog.svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import Video from "$lib/components/Video.svelte";
  import { articleNode } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  const PATH = "/thoughts/love-bombed";
  const TITLE = "love bombed";
  const PUBLISHED = "2026-10-13";
  const POSTER = "/assets/love-bombed/love-bombed-poster.jpg";
  const DESCRIPTION =
    "the second mouth machine piece: a 94 second video for a birthday, and the log of every turn it took to get there.";
</script>

<SeoHead
  title={TITLE}
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="hands on a guitar in wine on pink, with the words 10 years of birthdays along the bottom"
  preloadImage={POSTER}
  schema={articleNode({
    path: PATH,
    headline: TITLE,
    image: POSTER,
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: PATH, name: TITLE },
  ]}
/>

<!-- The piece sits above the log and again below it: the thing first, how
     it got made, then the thing again. Only the first one fetches metadata
     up front; the second waits for a tap. -->
{#snippet piece(preload: "metadata" | "none")}
  <Video
    controls
    playsinline
    {preload}
    src="/assets/love-bombed/love-bombed.mp4"
    poster={POSTER}
    aria-label="love bombed, piece 2 of mouth machine: wine shapes on pink, guitar over a loop of mouth drums, a spoken piece with its words along the bottom"
    class="mx-auto my-9 block aspect-9/16 w-full max-w-sm rounded-lg bg-black md:my-12"
    tracks={[
      {
        src: "/assets/love-bombed/love-bombed.vtt",
        srclang: "en",
        label: "English",
        kind: "captions",
      },
    ]}
  />
{/snippet}

<main class="min-h-dvh bg-(--ground) text-(--ink)">
  <article class="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
    <header class="mb-9 md:mb-12">
      <p
        class="mb-4 font-mono text-xs uppercase tracking-section text-coin md:text-sm"
      >
        mouth machine
      </p>
      <h1 class="font-display text-4xl uppercase tracking-base md:text-6xl">
        love bombed
      </h1>
      <p class="mt-6 font-sans text-base leading-relaxed text-(--soft) md:text-lg">
        kept by claude, one entry per turn, while Sam made the video below.
        where it says "this side", that is claude's side.
      </p>
    </header>

    {@render piece("metadata")}

    <MakingLog {html} />

    {@render piece("none")}

    <footer
      class="mt-18 flex flex-wrap justify-between gap-x-9 gap-y-4 border-t border-(--rule) pt-9 font-mono text-xs uppercase tracking-section md:mt-24 md:text-sm"
    >
      <a href="/thoughts" class="text-(--soft) transition-colors hover:text-coin">
        ← all thoughts
      </a>
      <a
        href="/thoughts/mouth-machine"
        class="text-(--soft) transition-colors hover:text-coin"
      >
        sea foam, the first piece →
      </a>
    </footer>
  </article>
</main>

<style>
  /* Two colours, the piece's own: the pink and the wine of the video. A dark
     device gets pink on wine, a light one wine on pink, and the two shades
     between swap with them. --soft is small text (4.5:1 or better on its
     ground), --rule is lines and fills. The accent here is the ink, so --coin
     follows it for the shared pieces: links, quote bars, code. */
  main {
    --ground: #240a14;
    --ink: #ff8fb3;
    --soft: #d47a97;
    --rule: #5c2238;
    --coin: var(--ink);
    color-scheme: dark;
  }
  @media (prefers-color-scheme: light) {
    main {
      --ground: #ff8fb3;
      --ink: #240a14;
      --soft: #4d1a2d;
      --rule: #e87aa0;
      color-scheme: light;
    }
  }
</style>
