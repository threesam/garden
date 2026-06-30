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
  ogImage="/assets/certainly-uncertain-hero.webp"
  ogImageAlt="an ascii-art banana built from the chemical names that legally hide under 'natural flavors'"
  preloadImage="/assets/certainly-uncertain-hero.webp"
  schema={articleNode({
    path: "/thoughts/certainly-uncertain",
    headline: "certainly uncertain",
    image: "/assets/certainly-uncertain-hero.webp",
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

    <img
      src="/assets/certainly-uncertain-hero.webp"
      alt="an ascii-art banana built from the chemical names that legally hide under 'natural flavors'"
      width="1400"
      height="1164"
      fetchpriority="high"
      class="my-9 block w-full rounded-2xl md:my-12"
    />

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
