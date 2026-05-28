<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { collectionPageNode } from "$lib/seo";
  import ShelfHero from "$lib/components/ShelfHero.svelte";
  import { proxyImg } from "$lib/img";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { sorted, featured, featuredLabel } = $derived(data);
</script>

<SeoHead
  title="shelf"
  description="Books, media, and the things that shape how I think."
  canonical="/shelf"
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
        class="group relative block break-inside-avoid p-1.5 md:transition-[background-color,box-shadow] md:duration-300 md:ease-out md:hover:z-10 md:hover:bg-[var(--coin)] md:hover:shadow-[0_0_0_4px_var(--coin)]"
      >
        {#if book.coverUrl}
          <img
            src={proxyImg(book.coverUrl, 200)}
            alt={book.cleanTitle}
            width="200"
            height="300"
            loading="lazy"
            class="block h-auto w-full md:transition-[filter] md:duration-300 md:group-hover:grayscale"
          />
        {:else}
          <div class="flex aspect-2/3 w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-zinc-600">
            {book.cleanTitle}
          </div>
        {/if}
      </a>
    {/each}
  </section>
</main>
