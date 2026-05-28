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
];

// Stable @ids so every page's graph references one shared Person/WebSite entity
// rather than redefining them — this is what fuses the whole site to one identity.
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

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
export function buildGraph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [PERSON_NODE, WEBSITE_NODE, ...nodes],
  };
}

// ---- Per-page node builders -----------------------------------------------
// Each returns a single @graph member (no @context — the graph owns that) that
// references the Person/WebSite by @id. Pass to <SeoHead schema={...} />.

/** Profile/about page anchored to the Person entity (e.g. /self). */
export function profilePageNode(opts: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@type": "ProfilePage",
    "@id": `${absUrl(opts.path)}#webpage`,
    url: absUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    mainEntity: { "@id": PERSON_ID },
  };
}

/** A single narrative piece authored by Sam (e.g. /dad, /benny, /deana). */
export function articleNode(opts: {
  path: string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
}) {
  const node: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${absUrl(opts.path)}#article`,
    headline: opts.headline,
    description: opts.description,
    url: absUrl(opts.path),
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
  if (opts.image) node.image = absUrl(opts.image);
  if (opts.datePublished) node.datePublished = opts.datePublished;
  return node;
}

/** An index page grouping many works (e.g. /shelf, /anything-but-analog). */
export function collectionPageNode(opts: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@type": "CollectionPage",
    "@id": `${absUrl(opts.path)}#webpage`,
    url: absUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
  };
}

/** The essays section (/thoughts). */
export function blogNode(opts: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@type": "Blog",
    "@id": `${absUrl(opts.path)}#blog`,
    url: absUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
  };
}

/** A generative sketch (anything-but-analog/[slug]). */
export function creativeWorkNode(opts: {
  path: string;
  name: string;
  description: string;
  image?: string;
  datePublished?: string;
}) {
  const node: Record<string, unknown> = {
    "@type": "CreativeWork",
    "@id": `${absUrl(opts.path)}#creativework`,
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path),
    creator: { "@id": PERSON_ID },
    isPartOf: { "@id": `${SITE_URL}/anything-but-analog#webpage` },
  };
  if (opts.image) node.image = absUrl(opts.image);
  if (opts.datePublished) node.datePublished = opts.datePublished;
  return node;
}
