export const SITE_URL = "https://threesam.com";

export const SITE_DESCRIPTION =
  "Artist-engineer creating at the intersection of sound, code, and human performance.";

export const PERSON_NAME = "Sam D'Angelo";
export const PERSON_ALT = "threesam";

/** Topics Sam works in — declares topical authority to answer/generative engines. */
export const KNOWS_ABOUT = [
  "Sound design",
  "Music production",
  "Creative coding",
  "Generative art",
  "Software engineering",
  "Human performance",
  "Building with AI",
  "AI orchestration",
  "Agentic workflows",
];

// Stable @ids so every page's graph references one shared Person/WebSite entity
// rather than redefining them — this is what fuses the whole site to one identity.
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * The site's content pages in one place — the single source consumed by both
 * the sitemap and /llms.txt, so a new page is added once rather than in two
 * formats. (The homepage gallery curates its own visual subset separately, as
 * its cards carry per-handle canvas wiring beyond a plain path/label.)
 */
export const SITE_PAGES: Array<{ path: string; label: string; blurb: string }> = [
  {
    path: "/self",
    label: "self",
    blurb: "Sam's story — growing up in Trenton, making art, and finding a way through.",
  },
  {
    path: "/anything-but-analog",
    label: "anything but analog",
    blurb: "Generative art — code-driven visual sketches.",
  },
  {
    path: "/deana",
    label: "deana",
    blurb: "A data-art project on 102,549 messages across 10 years — one conversation.",
  },
  { path: "/benny", label: "benny", blurb: "Remembering 102 Jackson Street." },
  { path: "/dad", label: "dad", blurb: "Stories about Sam's dad." },
  {
    path: "/shelf",
    label: "shelf",
    blurb: "Books, media, and the things that shape how Sam thinks.",
  },
  { path: "/thoughts", label: "thoughts", blurb: "Personal stories and thoughts." },
  { path: "/sounds", label: "sounds", blurb: "Original music — demos and scores." },
];

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}

export function resolveTitle(title: string | undefined): string {
  if (!title) return "threesam";
  return `${title} — threesam`;
}

/**
 * Stringify JSON-LD for inline injection, neutralising `<` so a stray
 * `</script>` sequence in any field can't break out of the script tag.
 */
export function jsonLdToScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path}`;
}

// The two reference entities, defined once and linked by @id everywhere else.
const PERSON_NODE = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: PERSON_NAME,
  alternateName: PERSON_ALT,
  url: SITE_URL,
  image: `${SITE_URL}/assets/sam-dangelo.webp`,
  jobTitle: "Artist-Engineer",
  description: SITE_DESCRIPTION,
  knowsAbout: KNOWS_ABOUT,
  sameAs: [
    "https://www.linkedin.com/in/threesam/",
    "https://github.com/threesam",
    "https://soundcloud.com/threesam",
    "https://substack.com/@threesam",
    "https://x.com/six_to_m",
    "https://sixtom.com",
  ],
};

const WEBSITE_NODE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "threesam",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
};

/**
 * Assemble a page's JSON-LD @graph: the shared Person + WebSite entities
 * (always present, so every page reinforces them) plus any page-specific nodes,
 * all cross-linked by @id.
 */
export function buildGraph(...nodes: object[]): object {
  return {
    "@context": "https://schema.org",
    "@graph": [PERSON_NODE, WEBSITE_NODE, ...nodes],
  };
}

// ---- Per-page node builders -----------------------------------------------
// Each returns a single @graph member (no @context — the graph owns that) that
// references the Person/WebSite by @id. Pass to <SeoHead schema={...} />, which
// injects the page's `description` so it can't drift from the <meta> description.

/** Profile/about page anchored to the Person entity (e.g. /self). */
export function profilePageNode(opts: { path: string; name: string }): object {
  return {
    "@type": "ProfilePage",
    "@id": `${absUrl(opts.path)}#webpage`,
    url: absUrl(opts.path),
    name: opts.name,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    mainEntity: { "@id": PERSON_ID },
  };
}

/** A single narrative piece authored by Sam (e.g. /dad, /benny, /deana). */
export function articleNode(opts: {
  path: string;
  headline: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}): object {
  const node: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${absUrl(opts.path)}#article`,
    headline: opts.headline,
    url: absUrl(opts.path),
    mainEntityOfPage: absUrl(opts.path),
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
  if (opts.image) node.image = absUrl(opts.image);
  if (opts.datePublished) node.datePublished = opts.datePublished;
  // Always present so engines have a freshness signal; an explicit value wins
  // when an essay is edited, else it mirrors datePublished.
  if (opts.dateModified ?? opts.datePublished)
    node.dateModified = opts.dateModified ?? opts.datePublished;
  return node;
}

/** An index page grouping many works (e.g. /shelf, /anything-but-analog). */
export function collectionPageNode(opts: { path: string; name: string }): object {
  return {
    "@type": "CollectionPage",
    "@id": `${absUrl(opts.path)}#webpage`,
    url: absUrl(opts.path),
    name: opts.name,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
  };
}

/** The essays section (/thoughts). */
export function blogNode(opts: { path: string; name: string }): object {
  return {
    "@type": "Blog",
    "@id": `${absUrl(opts.path)}#blog`,
    url: absUrl(opts.path),
    name: opts.name,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
  };
}

/** A generative sketch (anything-but-analog/[slug]). */
export function creativeWorkNode(opts: {
  path: string;
  name: string;
  image?: string;
  datePublished?: string;
}): object {
  const node: Record<string, unknown> = {
    "@type": "CreativeWork",
    "@id": `${absUrl(opts.path)}#creativework`,
    name: opts.name,
    url: absUrl(opts.path),
    creator: { "@id": PERSON_ID },
    isPartOf: { "@id": `${SITE_URL}/anything-but-analog#webpage` },
  };
  if (opts.image) node.image = absUrl(opts.image);
  if (opts.datePublished) node.datePublished = opts.datePublished;
  return node;
}

/** BreadcrumbList — gives answer engines a way to surface the page in
 * site context ("Home › Shelf"). Pass the trail from root → current. */
export function breadcrumbNode(
  trail: Array<{ path: string; name: string }>,
): object {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absUrl(trail[trail.length - 1]?.path ?? "/")}#breadcrumb`,
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absUrl(step.path),
    })),
  };
}

/** A music release/track listing (e.g. /sounds). MusicPlaylist is the
 * loosest fit for a curated demo/score set — MusicAlbum implies a
 * single release. Each track is a MusicRecording. */
export function musicPlaylistNode(opts: {
  path: string;
  name: string;
  tracks: Array<{ name: string; url?: string }>;
}): object {
  return {
    "@type": "MusicPlaylist",
    "@id": `${absUrl(opts.path)}#playlist`,
    name: opts.name,
    url: absUrl(opts.path),
    creator: { "@id": PERSON_ID },
    numTracks: opts.tracks.length,
    track: opts.tracks.map((t, i) => ({
      "@type": "MusicRecording",
      position: i + 1,
      name: t.name,
      byArtist: { "@id": PERSON_ID },
      ...(t.url ? { url: absUrl(t.url) } : {}),
    })),
  };
}

/**
 * WebPage anchor for the homepage. Pairs with itemListNode (over SITE_PAGES)
 * so search engines + answer engines pick up the site index in structured
 * form alongside the natural-language llms.txt and the sitemap.
 */
export function homePageNode(): object {
  return {
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: `${SITE_URL}/`,
    name: "threesam",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    primaryImageOfPage: `${SITE_URL}/og/home.png`,
    inLanguage: "en",
  };
}

/** A curated list of items on a CollectionPage (e.g. /shelf). Generic
 * ItemList so the same helper works for books, links, anything. */
export function itemListNode(opts: {
  path: string;
  name: string;
  items: Array<{ url: string; name: string }>;
}): object {
  return {
    "@type": "ItemList",
    "@id": `${absUrl(opts.path)}#itemlist`,
    name: opts.name,
    itemListElement: opts.items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: it.url,
      name: it.name,
    })),
  };
}
