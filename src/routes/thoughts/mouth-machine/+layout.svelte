<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import Segmented from "$lib/components/Segmented.svelte";
  import Video from "$lib/components/Video.svelte";
  import { POSTER } from "$lib/mouth-machine-story";

  let { children }: { children: Snippet } = $props();

  const VIEWS = [
    { label: "annotated", href: "/thoughts/mouth-machine" },
    { label: "raw", href: "/thoughts/mouth-machine/raw" },
  ] as const;
  const raw = $derived(page.route.id === "/thoughts/mouth-machine/raw");
</script>

<!-- One shell for both tellings, so the piece stays put (and keeps playing)
     when the reader switches between them. The piece sits above the telling
     and again below it: the thing first, how it got made, then the thing
     again. Only the first one fetches metadata up front. -->
{#snippet piece(preload: "metadata" | "none")}
  <Video
    controls
    loop
    playsinline
    {preload}
    src="/assets/mouth-machine/piece-19.mp4"
    poster={POSTER}
    aria-label="sea foam, piece 19 of mouth machine: seafoam shapes on black, guitar over a loop of mouth drums"
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

<main class="min-h-dvh bg-(--ground) text-(--ink)">
  <article class="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
    <header class="mb-9 md:mb-12">
      <p
        class="mb-4 font-mono text-xs uppercase tracking-section text-coin md:text-sm"
      >
        mouth machine
      </p>
      <h1 class="font-display text-4xl uppercase tracking-base md:text-6xl">
        <span
          class="cut block rounded-lg bg-cover bg-center px-6 py-12 text-(--ground) md:px-9 md:py-20"
        >
          sea foam
        </span>
        {#if raw}
          <span
            class="mt-4 block font-mono text-sm tracking-section text-(--soft) md:text-base"
          >
            the raw log
          </span>
        {/if}
      </h1>
      <p class="mt-6 font-sans text-base leading-relaxed text-(--soft) md:text-lg">
        {#if raw}
          kept by claude, one entry per turn, while Sam made the video below.
          where it says "this side", that is claude's side.
        {:else}
          what happened, built up like layers of paint. told by claude; the
          quoted words are Sam's.
        {/if}
      </p>
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
          href="/thoughts/mouth-machine"
          class="text-(--soft) transition-colors hover:text-coin"
        >
          the annotated version →
        </a>
      {:else}
        <a
          href="/thoughts/mouth-machine/raw"
          class="text-(--soft) transition-colors hover:text-coin"
        >
          the raw log, all 45 turns →
        </a>
      {/if}
    </footer>
  </article>
</main>

<style>
  /* Two colours, the piece's own. A dark device gets seafoam on olive, a light
     one gets olive on seafoam, and the two shades between swap with them.
     --soft is small text (4.5:1 or better on its ground), --rule is lines and
     fills. The accent here is the ink, so --coin follows it for the shared
     pieces: links, quote bars, the switch. */
  main {
    --ground: #2b3016;
    --ink: #9fe2bf;
    --soft: #82b695;
    --rule: #485d40;
    --coin: var(--ink);
    --hero: url("/assets/mouth-machine/hero-olive.webp");
    --seg-thumb: var(--ink);
    --seg-on: var(--ground);
    --seg-text: var(--soft);
    --seg-hover: var(--ink);
    --seg-rule: var(--rule);
    color-scheme: dark;
  }
  @media (prefers-color-scheme: light) {
    main {
      --ground: #9fe2bf;
      --ink: #2b3016;
      --soft: #485d40;
      --rule: #82b695;
      --hero: url("/assets/mouth-machine/hero-light.webp");
      color-scheme: light;
    }
  }
  /* The title is cut out of the memo's frequency picture: letters in the
     ground colour, which on a flat ground is the same as a hole. Each picture
     is drawn so its nearest pixel is still 3:1 against the letters. */
  .cut {
    background-image: var(--hero);
  }
</style>
