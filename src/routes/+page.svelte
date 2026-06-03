<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import BrandSignoff from '$lib/components/frame/BrandSignoff.svelte';
  import { SITE_PAGES, SITE_URL, homePageNode, itemListNode } from '$lib/seo';

  // Structured site index for search + answer engines. Mirrors the
  // natural-language /llms.txt and the sitemap so the same SITE_PAGES
  // source feeds all three crawl surfaces.
  const homeSchema = [
    homePageNode(),
    itemListNode({
      path: '/',
      name: 'threesam — site index',
      items: SITE_PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, name: p.label })),
    }),
  ];
</script>

<SeoHead canonical="/" ogImage="/og/home.png" schema={homeSchema} />

<!--
  Single-viewport homepage on a flat --coin field: a 50dvh gallery strip
  centered between 25dvh top/bottom spacers. No page scroll. The animated cloud
  sky was retired for the homepage (no image fetched); the shared CloudCanvas
  still runs elsewhere via the layout Anchor, which stays suppressed on `/`.
-->
<main class="relative flex h-dvh w-full flex-col overflow-hidden bg-coin">
  <div class="h-[25dvh] w-full"></div>
  <div class="relative h-[50dvh] w-full">
    <Gallery />
  </div>
  <div class="h-[25dvh] w-full"></div>

  <BrandSignoff heading />
</main>
