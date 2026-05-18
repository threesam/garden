<script lang="ts">
  import { SITE_URL, SITE_DESCRIPTION, resolveTitle } from '$lib/seo';

  interface Props {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    /** URL of the hero LCP image to preload. Adds a high-priority preload hint. */
    preloadImage?: string;
  }
  let { title, description, ogImage, canonical, preloadImage }: Props = $props();

  const resolvedTitle = $derived(resolveTitle(title));
  const resolvedDescription = $derived(description ?? SITE_DESCRIPTION);
  const resolvedOg = $derived.by(() => {
    const path = ogImage ?? '/og/default.png';
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path}`;
  });
  const resolvedCanonical = $derived(canonical ?? '/');
</script>

<svelte:head>
  {#if preloadImage}
    <link rel="preload" as="image" href={preloadImage} fetchpriority="high" />
  {/if}
  <title>{resolvedTitle}</title>
  <meta name="description" content={resolvedDescription} />
  <link rel="canonical" href={`${SITE_URL}${resolvedCanonical}`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="threesam" />
  <meta property="og:url" content={`${SITE_URL}${resolvedCanonical}`} />
  <meta property="og:title" content={resolvedTitle} />
  <meta property="og:description" content={resolvedDescription} />
  <meta property="og:image" content={resolvedOg} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={resolvedTitle} />
  <meta name="twitter:description" content={resolvedDescription} />
  <meta name="twitter:image" content={resolvedOg} />
</svelte:head>
