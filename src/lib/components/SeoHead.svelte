<script lang="ts">
  import { SITE_URL, SITE_DESCRIPTION, resolveTitle, jsonLdToScript, buildGraph } from '$lib/seo';

  interface Props {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    /** URL of the hero LCP image to preload. Adds a high-priority preload hint. */
    preloadImage?: string;
    /** og:type — 'website' (default), 'article', or 'profile'. */
    ogType?: string;
    /** Alt text for the social image. Falls back to the resolved page title. */
    ogImageAlt?: string;
    /** Page-specific schema.org node(s) merged into the JSON-LD @graph (with Person + WebSite). */
    schema?: object | object[];
  }
  let {
    title,
    description,
    ogImage,
    canonical,
    preloadImage,
    ogType = 'website',
    ogImageAlt,
    schema,
  }: Props = $props();

  const resolvedTitle = $derived(resolveTitle(title));
  const resolvedDescription = $derived(description ?? SITE_DESCRIPTION);
  const resolvedOg = $derived.by(() => {
    const path = ogImage ?? '/og/default.png';
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path}`;
  });
  const resolvedCanonical = $derived(canonical ?? '/');
  const resolvedImageAlt = $derived(ogImageAlt ?? resolvedTitle);
  // Pre-stringified @graph: shared Person + WebSite plus any page node(s). The
  // page description is folded into each node so schema can't drift from <meta>.
  const graphScript = $derived.by(() => {
    let nodes: object[] = [];
    if (Array.isArray(schema)) nodes = schema;
    else if (schema) nodes = [schema];
    const described = nodes.map((n) => ({ ...n, description: resolvedDescription }));
    return jsonLdToScript(buildGraph(...described));
  });
</script>

<svelte:head>
  {#if preloadImage}
    <link rel="preload" as="image" href={preloadImage} fetchpriority="high" />
  {/if}
  <title>{resolvedTitle}</title>
  <meta name="description" content={resolvedDescription} />
  <link rel="canonical" href={`${SITE_URL}${resolvedCanonical}`} />
  <meta property="og:type" content={ogType} />
  <meta property="og:site_name" content="threesam" />
  <meta property="og:url" content={`${SITE_URL}${resolvedCanonical}`} />
  <meta property="og:title" content={resolvedTitle} />
  <meta property="og:description" content={resolvedDescription} />
  <meta property="og:image" content={resolvedOg} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={resolvedImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={resolvedTitle} />
  <meta name="twitter:description" content={resolvedDescription} />
  <meta name="twitter:image" content={resolvedOg} />
  <meta name="twitter:image:alt" content={resolvedImageAlt} />
  <!--
    JSON-LD must go through {@html}: Svelte renders `{expr}` literally inside a
    raw-text <script>, so a real element would emit the placeholder, not the data.
    Safe here — graphScript is our own data with `<` escaped (see jsonLdToScript).
  -->
  {@html `<script type="application/ld+json">${graphScript}<\/script>`}
</svelte:head>
