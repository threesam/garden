<script lang="ts">
  import {
    SITE_URL,
    SITE_DESCRIPTION,
    SITE_PAGES,
    resolveTitle,
    jsonLdToScript,
    buildGraph,
    breadcrumbNode,
  } from '$lib/seo';

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
    /** Override the auto-derived breadcrumb trail. Leaf paths
     * (`/anything-but-analog/<slug>`) should pass their full trail. Top-
     * level routes leave this undefined and get a Home → Page crumb
     * derived from SITE_PAGES. Pass `null` to suppress the breadcrumb. */
    breadcrumbTrail?: Array<{ path: string; name: string }> | null;
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
    breadcrumbTrail,
  }: Props = $props();

  const resolvedTitle = $derived(resolveTitle(title));
  const resolvedDescription = $derived(description ?? SITE_DESCRIPTION);
  const resolvedOg = $derived.by(() => {
    const path = ogImage ?? '/og/home.png';
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path}`;
  });
  const resolvedCanonical = $derived(canonical ?? '/');
  const resolvedImageAlt = $derived(ogImageAlt ?? resolvedTitle);
  // Auto-derive Home → Page from SITE_PAGES when no explicit trail is
  // passed. Homepage gets no crumb (single hop is meaningless).
  const breadcrumb = $derived.by(() => {
    if (breadcrumbTrail === null) return null;
    if (breadcrumbTrail) return breadcrumbNode(breadcrumbTrail);
    if (resolvedCanonical === '/') return null;
    const segment = SITE_PAGES.find((p) =>
      resolvedCanonical === p.path || resolvedCanonical.startsWith(`${p.path}/`),
    );
    if (!segment) return null;
    return breadcrumbNode([
      { path: '/', name: 'threesam' },
      { path: segment.path, name: segment.label },
    ]);
  });
  // Pre-stringified @graph: shared Person + WebSite plus any page node(s). The
  // page description is folded into each node so schema can't drift from <meta>.
  const graphScript = $derived.by(() => {
    let nodes: object[] = [];
    if (Array.isArray(schema)) nodes = schema;
    else if (schema) nodes = [schema];
    const described = nodes.map((n) => ({ ...n, description: resolvedDescription }));
    const all = breadcrumb ? [...described, breadcrumb] : described;
    return jsonLdToScript(buildGraph(...all));
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
