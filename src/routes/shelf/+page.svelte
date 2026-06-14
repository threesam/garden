<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import ShelfHero from "$lib/components/ShelfHero.svelte";
  import { proxyImg } from "$lib/img";
  import Img from "$lib/components/Img.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { sorted, featured, featuredLabel } = $derived(data);

  // Featured book cover is the LCP element. Preload it from the head so
  // the browser starts the fetch before parsing the body. URL must match
  // the <img> src in ShelfHero exactly (same proxyImg width) so the
  // preloaded response gets reused instead of a second fetch firing.
  const featuredCoverPreload = $derived(
    featured?.coverUrl ? proxyImg(featured.coverUrl, 400) : undefined,
  );
</script>

<SeoHead
  title="shelf"
  description="Books, media, and the things that shape how I think."
  canonical="/shelf"
  ogImage="/og/shelf.jpg"
  preloadImage={featuredCoverPreload}
  schema={collectionPageNode({
    path: "/shelf",
    name: "shelf — threesam",
  })}
/>

<main
  class="copy-lower min-h-screen pb-18"
  style="background: linear-gradient(to bottom, var(--black) 40%, var(--white)); color: var(--white);"
>
  <ShelfHero {featured} {featuredLabel} />

  <section class="columns-4 gap-0 overflow-hidden py-1.5 sm:columns-6 md:columns-8 lg:columns-10 xl:columns-12">
    {#each sorted as book (book.id)}
      <a
        href={`https://www.goodreads.com/book/show/${book.id}`}
        target="_blank"
        rel="noopener noreferrer"
        class="group relative block break-inside-avoid p-1.5 md:transition-[background-color,box-shadow] md:duration-300 md:ease-out md:hover:z-10 md:hover:bg-coin md:hover:shadow-[0_0_0_4px_var(--coin)]"
      >
        {#if book.coverUrl}
          <Img
            src={proxyImg(book.coverUrl, 320)}
            alt={book.cleanTitle}
            width={book.coverW ?? 200}
            height={book.coverH ?? 300}
            class="block h-auto w-full md:transition-[filter] md:duration-300 md:group-hover:grayscale"
          />
        {:else}
          <div class="flex aspect-2/3 w-full items-center justify-center bg-black p-3 text-center text-xs text-zinc-600">
            {book.cleanTitle}
          </div>
        {/if}
      </a>
    {/each}
  </section>
</main>
