<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { articleNode } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  // Published to this (owned) site first; LinkedIn syndicates after, so
  // threesam is the canonical source. Mirror this in the Article graph.
  const PUBLISHED = "2026-06-29";
</script>

<SeoHead
  title="certainly uncertain"
  description="the only certainty is that you can't know."
  canonical="/thoughts/certainly-uncertain"
  ogType="article"
  schema={articleNode({
    path: "/thoughts/certainly-uncertain",
    headline: "certainly uncertain",
    image: "/og/home.png",
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: "/thoughts/certainly-uncertain", name: "certainly uncertain" },
  ]}
/>

<main class="min-h-dvh bg-stone-50 text-stone-900">
  <article class="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
    <header class="mb-9 md:mb-12">
      <p
        class="mb-4 font-mono text-xs uppercase tracking-section text-coin md:text-sm"
      >
        // thought
      </p>
      <h1
        class="font-mono text-4xl font-bold uppercase tracking-base text-stone-900 md:text-6xl"
      >
        certainly uncertain
      </h1>
    </header>

    <!-- Rendered by the shared markdown renderer (styled prose), same
         treatment the other content pages use. Author-controlled markdown. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- author-authored markdown rendered by our own pipeline -->
    {@html html}

    <footer class="mt-18 border-t border-stone-200 pt-9 md:mt-24">
      <a
        href="/thoughts"
        class="font-mono text-xs uppercase tracking-section text-stone-500 transition-colors hover:text-coin md:text-sm"
      >
        ← all thoughts
      </a>
    </footer>
  </article>
</main>
