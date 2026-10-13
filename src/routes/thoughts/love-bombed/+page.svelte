<script lang="ts">
  import { MediaQuery } from "svelte/reactivity";
  import { videoVisibility } from "$lib/actions/video-visibility";
  import { assetSize } from "$lib/asset-dimensions";
  import ReadMark from "$lib/components/ReadMark.svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import {
    BARS,
    POSTER,
    PUBLISHED,
    chorus,
    cover,
    coverStills,
    loop,
    song,
    timeline,
    visual,
    words,
    type Clip,
  } from "$lib/love-bombed-story";
  import { articleNode } from "$lib/seo";

  const PATH = "/thoughts/love-bombed";
  const DESCRIPTION =
    "the second mouth machine piece, a 94 second video for a birthday, taken apart: the song, the visual layers, the words and chorus, the cover.";

  // The clips play only while on screen, and not at all for a reader who has
  // asked for less motion. They start muted and carry native controls.
  const calm = new MediaQuery("(prefers-reduced-motion: reduce)");

  const H2 =
    "font-mono text-2xl font-bold uppercase tracking-[0.08em] text-balance md:text-4xl";
  const NOTE = "mt-3 font-mono text-xs leading-relaxed text-(--soft)";
</script>

<SeoHead
  title="love bombed"
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="hands on a guitar in wine on pink, with the words 10 years of birthdays along the bottom"
  preloadImage={POSTER}
  schema={articleNode({
    path: PATH,
    headline: "love bombed",
    image: POSTER,
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: PATH, name: "love bombed" },
  ]}
/>

{#snippet clip(c: Clip, n?: number)}
  <figure class="min-w-0">
    <video
      src={c.src}
      poster={c.poster}
      aria-label={c.alt}
      muted
      loop
      playsinline
      controls
      preload="none"
      class={[
        "block w-full rounded-lg bg-black",
        c.wide ? "aspect-video" : "aspect-9/16",
      ]}
      use:videoVisibility={{ autoplay: !calm.current }}
    ></video>
    <figcaption class="mt-3 font-mono text-xs leading-relaxed md:text-sm">
      {#if n}<span class="text-(--soft)">{n}</span>{/if}
      {c.caption}
      {#if c.sound}<span class="text-(--soft)">· has sound</span>{/if}
      {#if c.how}<span class="mt-2 block text-(--soft)">{c.how}</span>{/if}
    </figcaption>
  </figure>
{/snippet}

<section aria-labelledby="song">
  <h2 id="song" class={H2}>how i structured the song</h2>

  <figure class="mt-9 md:mt-12">
    <img
      src={loop.src}
      alt={loop.alt}
      width={assetSize(loop.src)?.w}
      height={assetSize(loop.src)?.h}
      decoding="async"
      class="block w-full rounded-lg"
    />
    <audio
      src={loop.sound}
      controls
      loop
      preload="none"
      aria-label="the loop: four bars of mouth drums"
      class="mt-3 block w-full"
    ></audio>
    <figcaption class={NOTE}>{loop.caption}</figcaption>
  </figure>

  <!-- The whole piece as one strip, a column a bar. The list under it says the
       same thing in words, so the strip is a picture to a screen reader. -->
  <div
    class="bars mt-9 md:mt-12"
    role="img"
    aria-label="the piece as a strip of {BARS} bars. mouth drums run under all of it. guitar: the center take's first half four times, the center take whole, the bottom-left take, the top-right take, then a quarter of the bottom-left take backwards four times. the spoken words run from bar 13 to bar 74. the sung my love comes at bars 74, 78, 82 and 86. the mouth drums come to the front from bar 73."
  >
    {#each timeline as row (row.label)}
      <p class="mb-1 mt-4 font-mono text-xs uppercase tracking-section text-(--soft)">
        {row.label}
      </p>
      <div class="row" style:--bars={BARS}>
        {#each row.spans as s (s.from)}
          <span
            class:faint={s.faint}
            style:grid-column="{s.from + 1} / span {s.len}">{s.n ?? ""}</span
          >
        {/each}
      </div>
    {/each}
  </div>
  <p class={NOTE}>
    {BARS} bars of three, a little over a second each. the numbers are the
    clips below
  </p>

  <!-- role: the reset takes the numbers off, and Safari then stops calling it a list -->
  <ol
    role="list"
    class="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:mt-12 md:grid-cols-4"
  >
    {#each song as part, i (part.src)}
      <li class="min-w-0">
        {@render clip(part, i + 1)}
        <p class={NOTE}>{part.bars}</p>
      </li>
    {/each}
  </ol>
  <p class={[NOTE, "mt-9"]}>
    the loop was playing in the room for every take, so it is under all of it.
    it comes to the front, clean, where the guitar turns backwards
  </p>
</section>

<section class="mt-24 md:mt-36" aria-labelledby="layers">
  <h2 id="layers" class={H2}>
    how i structured the visual layers and the effects used
  </h2>
  <!-- role: the reset takes the numbers off, and Safari then stops calling it a list -->
  <ol
    role="list"
    class="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:mt-12 md:grid-cols-4"
  >
    {#each visual as layer, i (layer.src)}
      <li class={["min-w-0", layer.wide && "col-span-2"]}>
        {@render clip(layer, i + 1)}
      </li>
    {/each}
  </ol>
  <p class={[NOTE, "mt-9"]}>
    in the last sixteen bars the guitar fades away and the letters fade into
    the videos they were drawn from
  </p>
  <p class="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs md:text-sm">
    <span class="flex items-center gap-2">
      <span class="chip bg-[#ff8fb3]"></span>#ff8fb3
    </span>
    <span class="flex items-center gap-2">
      <span class="chip bg-[#240a14]"></span>#240a14
    </span>
    <span class="text-(--soft)">two colours, nothing else</span>
  </p>
</section>

<section class="mt-24 md:mt-36" aria-labelledby="words">
  <h2 id="words" class={H2}>
    how i structured the words and chorus, and how i got the heads
  </h2>
  <div class="mt-9 grid gap-9 md:mt-12 md:grid-cols-2">
    <p class="font-sans text-lg leading-relaxed md:text-xl">
      {#each words as line, i (i)}
        <span class="block">{line}</span>
      {/each}
    </p>
    <div class="max-w-sm">{@render clip(chorus)}</div>
  </div>
</section>

<section class="mt-24 md:mt-36" aria-labelledby="cover">
  <h2 id="cover" class={H2}>how i did the cover</h2>
  <div class="mt-9 grid gap-9 md:mt-12 md:grid-cols-2">
    <div class="max-w-sm">{@render clip(cover)}</div>
    <div class="grid content-start gap-9">
      {#each coverStills as s (s.src)}
        <figure class="min-w-0">
          <img
            src={s.src}
            alt={s.alt}
            width={assetSize(s.src)?.w}
            height={assetSize(s.src)?.h}
            loading="lazy"
            decoding="async"
            class="block w-full rounded-lg"
          />
          <figcaption class={NOTE}>{s.caption}</figcaption>
        </figure>
      {/each}
    </div>
  </div>
</section>
<ReadMark />

<style>
  /* One row of the strip: a column for every bar, a block for every stretch. */
  .row {
    display: grid;
    grid-template-columns: repeat(var(--bars), minmax(0, 1fr));
    column-gap: 1px;
    background: var(--rule);
    border-radius: 0.25rem;
    overflow: hidden;
  }
  .row span {
    min-height: 1.5rem;
    background: var(--ink);
    color: var(--ground);
    font-size: 0.6875rem;
    line-height: 1.5rem;
    text-align: center;
    font-variation-settings: "MONO" 1, "CASL" 0, "slnt" 0;
  }
  .row span.faint {
    opacity: 0.45;
  }
  .chip {
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--ink);
    border-radius: 9999px;
  }
</style>
