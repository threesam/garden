<script lang="ts">
  import { MediaQuery } from "svelte/reactivity";
  import { videoVisibility } from "$lib/actions/video-visibility";
  import { assetSize } from "$lib/asset-dimensions";
  import ReadMark from "$lib/components/ReadMark.svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import {
    OG,
    POSTER,
    PUBLISHED,
    VIDEO,
    layers,
    type Layer,
    type Still,
  } from "$lib/mouth-machine-story";
  import { articleNode, videoNode } from "$lib/seo";

  const DESCRIPTION =
    "a 34 second video that started as a voice memo of mouth drums, built up in seven layers: what Sam asked for, and what each ask put on.";

  // The loops play only while on screen, and not at all for a reader who has
  // asked for less motion. They carry native controls either way.
  const calm = new MediaQuery("(prefers-reduced-motion: reduce)");

  const frame = (layer: Layer): string => {
    if (layer.pair) return "max-w-lg grid-cols-2";
    // The same cap as the piece's own player, so a phone gives a clip the
    // whole column.
    if (layer.media.some((m) => m.kind === "clip")) return "max-w-sm";
    return "";
  };

  // A picture with a sound plays it when pressed, and stops it when pressed
  // again. One player, so one sound at a time; `heard` is the one playing. It
  // is an element on the page so the site's tracker follows it like any other
  // sound, and so leaving the page stops it.
  let player = $state<HTMLAudioElement>();
  let heard = $state<string>();
  const stop = (): void => {
    player?.pause();
    heard = undefined;
  };
  const toggle = (src: string): void => {
    const was = heard;
    stop();
    if (was === src || !player) return;
    player.src = src;
    heard = src;
    // A file that would not load, or a press that stopped it first: back to
    // stopped, unless another sound has started since.
    player.play().catch(() => {
      if (heard === src) stop();
    });
  };

  const where = (phases: readonly number[]): string =>
    `${phases.length > 1 ? "phases" : "phase"} ${phases.join(", ")} in the raw log`;
</script>

<SeoHead
  title="sea foam"
  description={DESCRIPTION}
  canonical="/thoughts/mouth-machine"
  ogType="article"
  ogImage={OG}
  ogImageAlt="a seafoam ring on a black ground"
  preloadImage={POSTER}
  schema={[
    articleNode({
      path: "/thoughts/mouth-machine",
      headline: "sea foam",
      image: OG,
      datePublished: PUBLISHED,
      dateModified: "2026-10-11",
    }),
    videoNode({
      path: "/thoughts/mouth-machine",
      name: "sea foam",
      thumbnail: POSTER,
      contentUrl: VIDEO,
      uploadDate: PUBLISHED,
      duration: "PT35S",
      series: "mouth machine",
    }),
  ]}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: "/thoughts/mouth-machine", name: "sea foam" },
  ]}
/>

{#snippet still(m: Still)}
  <img
    src={m.src}
    alt={m.alt}
    width={assetSize(m.src)?.w}
    height={assetSize(m.src)?.h}
    loading="lazy"
    decoding="async"
    class="block w-full rounded-lg"
  />
{/snippet}

{#snippet said(ask: string)}
  <figure class="my-9 border-l-2 border-coin pl-6 md:pl-9">
    <blockquote class="font-sans text-xl leading-snug md:text-3xl">
      {ask}
    </blockquote>
    <figcaption
      class="mt-3 font-mono text-xs uppercase tracking-section text-(--soft)"
    >
      Sam
    </figcaption>
  </figure>
{/snippet}

{#snippet told(text: string, phases: readonly [number, ...number[]])}
  <p
    class="max-w-[60ch] font-sans text-base leading-relaxed md:text-xl"
  >
    {text}
  </p>
  <p class="mt-6 font-mono text-xs uppercase tracking-section">
    <a
      href="/thoughts/mouth-machine/raw#phase-{phases[0]}"
      class="inline-block py-1 text-(--soft) transition-colors hover:text-coin"
    >
      {where(phases)} →
    </a>
  </p>
{/snippet}

<p
  class="font-mono text-xs uppercase leading-relaxed tracking-section text-(--soft) md:text-sm"
>
  one thursday night into friday afternoon · 45 turns · {layers.length} layers
</p>

{#each layers as layer, i (layer.title)}
  <section class="mt-24 md:mt-36" aria-labelledby="layer-{i + 1}">
    <p
      class="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-section text-coin md:text-sm"
    >
      <span class="stack" aria-hidden="true">
        {#each layers as other, j (other.title)}
          <span class:on={j <= i}></span>
        {/each}
      </span>
      layer {i + 1} of {layers.length}
    </p>
    <h2
      id="layer-{i + 1}"
      class="font-mono text-2xl font-bold uppercase tracking-[0.08em] text-balance md:text-4xl"
    >
      {layer.title}
    </h2>

    {@render said(layer.ask)}
    {@render told(layer.told, layer.phases)}

    <div class={["mt-9 grid gap-4 md:mt-12", frame(layer)]}>
      {#each layer.media as m (m.src)}
        <figure class="min-w-0">
          {#if m.kind === "clip"}
            <video
              src={m.src}
              poster={m.poster}
              aria-label={m.alt}
              muted
              loop
              playsinline
              controls
              preload="none"
              class="block aspect-9/16 w-full rounded-lg bg-black"
              use:videoVisibility={{ autoplay: !calm.current }}
            ></video>
          {:else if m.kind === "img" && m.sound}
            {@const sound = m.sound}
            <button
              type="button"
              aria-pressed={heard === sound}
              class="block w-full cursor-pointer rounded-lg outline-offset-4 outline-coin aria-pressed:outline-2"
              onclick={() => {
                toggle(sound);
              }}
            >
              <span class="sr-only">play the sound:</span>
              {@render still(m)}
            </button>
          {:else}
            {@render still(m)}
          {/if}
          <figcaption
            class="mt-3 font-mono text-xs leading-relaxed text-(--soft)"
          >
            {m.caption}
          </figcaption>
        </figure>
      {/each}
    </div>
  </section>
{/each}

<!-- The piece comes again straight under this, from the layout. -->
<h2
  class="mt-24 font-mono text-2xl font-bold uppercase tracking-[0.08em] text-balance md:mt-36 md:text-4xl"
>
  where i stopped
</h2>
<audio bind:this={player} onended={stop}></audio>
<ReadMark />

<style>
  /* How many layers are on so far, as coats: the bottom one went on first. */
  .stack {
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
  }
  .stack span {
    width: 1rem;
    height: 2px;
    background: var(--rule);
  }
  .stack span.on {
    background: var(--coin);
  }
</style>
