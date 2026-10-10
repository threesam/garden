<script lang="ts">
  import ReadMark from "$lib/components/ReadMark.svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { POSTER, PUBLISHED } from "$lib/mouth-machine-story";
  import { articleNode } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  const PATH = "/thoughts/mouth-machine/raw";
  const TITLE = "mouth machine, the raw log";
  const DESCRIPTION =
    "the full log behind a 34 second video: 45 turns, each of Sam's asks quoted, what came back, what was kept and what went wrong.";
</script>

<SeoHead
  title={TITLE}
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="a seafoam ring on a black ground"
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
    { path: "/thoughts/mouth-machine", name: "mouth machine" },
    { path: PATH, name: "the raw log" },
  ]}
/>

<div class="log">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- author-authored markdown rendered by our own pipeline -->
  {@html html}
</div>
<ReadMark />

<style>
  /* A log, not an essay: 45 phases, lists, commands and two tables. The shared
     renderer sizes h2 and p for a short essay and leaves the rest bare, so
     this page sets a denser scale. Unlayered, so it wins over the utility
     classes the renderer puts on the elements. */
  .log :global(h2) {
    /* a layer on the annotated page links straight to its phase */
    scroll-margin-top: 2rem;
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
