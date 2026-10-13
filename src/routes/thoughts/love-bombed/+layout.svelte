<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import Segmented from "$lib/components/Segmented.svelte";
  import Video from "$lib/components/Video.svelte";
  import { POSTER, TURNS } from "$lib/love-bombed-story";

  let { children }: { children: Snippet } = $props();

  const VIEWS = [
    { label: "annotated", href: "/thoughts/love-bombed" },
    { label: "raw", href: "/thoughts/love-bombed/raw" },
  ] as const;
  const raw = $derived(page.route.id === "/thoughts/love-bombed/raw");
</script>

<!-- One shell for both tellings, so the piece stays put (and keeps playing)
     when the reader switches between them. The piece sits above the telling
     and again below it: the thing first, how it got made, then the thing
     again. Only the first one fetches metadata up front. -->
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
        {#if raw}
          <span
            class="mt-4 block font-mono text-sm tracking-section text-(--soft) md:text-base"
          >
            the raw log
          </span>
        {/if}
      </h1>
      {#if raw}
        <p
          class="mt-6 font-sans text-base leading-relaxed text-(--soft) md:text-lg"
        >
          kept by claude, one entry per turn, while Sam made the video below.
          where it says "this side", that is claude's side.
        </p>
      {/if}
      <div class="mt-6 w-fit">
        <Segmented items={VIEWS} active={raw ? 1 : 0} ariaLabel="version" />
      </div>
    </header>

    {@render piece("metadata")}

    {@render children()}

    {@render piece("none")}

    <footer
      class="mt-18 flex flex-wrap justify-between gap-x-9 gap-y-4 border-t border-(--rule) pt-9 font-mono text-xs uppercase tracking-section md:mt-24 md:text-sm"
    >
      <a href="/thoughts" class="text-(--soft) transition-colors hover:text-coin">
        ← all thoughts
      </a>
      {#if raw}
        <a
          href="/thoughts/love-bombed"
          class="text-(--soft) transition-colors hover:text-coin"
        >
          the annotated version →
        </a>
      {:else}
        <a
          href="/thoughts/love-bombed/raw"
          class="text-(--soft) transition-colors hover:text-coin"
        >
          the raw log, all {TURNS} turns →
        </a>
      {/if}
    </footer>
  </article>
</main>

<style>
  /* Two colours, the piece's own: the pink and the wine of the video. A dark
     device gets pink on wine, a light one wine on pink, and the two shades
     between swap with them. --soft is small text (4.5:1 or better on its
     ground), --rule is lines and fills. The accent here is the ink, so --coin
     follows it for the shared pieces: links, quote bars, the switch. */
  main {
    --ground: #240a14;
    --ink: #ff8fb3;
    --soft: #d47a97;
    --rule: #5c2238;
    --coin: var(--ink);
    --seg-thumb: var(--ink);
    --seg-on: var(--ground);
    --seg-text: var(--soft);
    --seg-hover: var(--ink);
    --seg-rule: var(--rule);
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
