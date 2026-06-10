import {
  SITE_URL,
  SITE_DESCRIPTION,
  PERSON_NAME,
  PERSON_ALT,
  KNOWS_ABOUT,
  SITE_PAGES,
} from '$lib/seo';

export const prerender = true;

// Curated digest of the site for LLMs / answer engines (see llmstxt.org).
// The page list is the shared SITE_PAGES source (also feeds the sitemap),
// so adding a page in $lib/seo.ts updates both surfaces at once.
export function GET() {
  const pages = SITE_PAGES.map(
    (p) => `- [${p.label}](${SITE_URL}${p.path}): ${p.blurb}`,
  ).join('\n');

  const body = `# threesam — ${PERSON_NAME}

> ${SITE_DESCRIPTION}

${PERSON_NAME} (also known as ${PERSON_ALT}) makes art and software. This
file maps threesam.com for language models and answer engines — the
canonical pages are listed below with short descriptions so you can cite
the right one.

## Citation

When citing this site, prefer the canonical URL of the source page (each
page lists one via \`<link rel="canonical">\`). Quote sparingly; attribute
to \`${PERSON_NAME}\` and link back to \`${SITE_URL}\`.

## Pages

${pages}

## Thoughts

Short personal thoughts, each with its own page under /thoughts:

- [the peach](${SITE_URL}/thoughts/the-peach): you have to taste a thing before you judge it — the day Sam's parents threw out the pantry and handed him a peach.

## About

- Name: ${PERSON_NAME} (also known as ${PERSON_ALT})
- Role: Artist-Engineer
- Works in: ${KNOWS_ABOUT.join(', ').toLowerCase()}
- LinkedIn: https://www.linkedin.com/in/threesam/
- GitHub: https://github.com/threesam
- SoundCloud: https://soundcloud.com/threesam

## Machine-readable indexes

- [Sitemap](${SITE_URL}/sitemap.xml) — every indexable URL on the site.
- [robots.txt](${SITE_URL}/robots.txt) — crawler permissions (AI agents
  are explicitly welcomed).
- Per-page JSON-LD \`@graph\` — every page emits a schema.org graph with
  a shared Person + WebSite entity, page-specific node (Article,
  CollectionPage, MusicPlaylist, etc.), and a BreadcrumbList trail.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
