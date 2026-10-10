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
        {#if raw}
          <span
            class="mt-4 block font-mono text-sm tracking-section text-zinc-400 md:text-base"
          >
            the raw log
          </span>
        {/if}
      </h1>
      <p class="mt-6 font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
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
      class="mt-18 flex flex-wrap justify-between gap-x-9 gap-y-4 border-t border-zinc-800 pt-9 font-mono text-xs uppercase tracking-section md:mt-24 md:text-sm"
    >
      <a href="/thoughts" class="text-zinc-400 transition-colors hover:text-coin">
        ← all thoughts
      </a>
      {#if raw}
        <a
          href="/thoughts/mouth-machine"
          class="text-zinc-400 transition-colors hover:text-coin"
        >
          the annotated version →
        </a>
      {:else}
        <a
          href="/thoughts/mouth-machine/raw"
          class="text-zinc-400 transition-colors hover:text-coin"
        >
          the raw log, all 45 turns →
        </a>
      {/if}
    </footer>
  </article>
</main>
