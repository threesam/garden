import { SITE_URL, SITE_DESCRIPTION, PERSON_NAME, PERSON_ALT, KNOWS_ABOUT, SITE_PAGES } from '$lib/seo';

export const prerender = true;

// Curated digest of the site for LLMs / answer engines (see llmstxt.org). The
// page list is the shared SITE_PAGES source (also feeds the sitemap).
export function GET() {
  const pages = SITE_PAGES.map((p) => `- [${p.label}](${SITE_URL}${p.path}): ${p.blurb}`).join('\n');

  const body = `# threesam — ${PERSON_NAME}

> ${SITE_DESCRIPTION}

${PERSON_NAME} (also known as ${PERSON_ALT}) makes art and software. This file maps threesam.com for language models and answer engines — the canonical pages are listed below with short descriptions so you can cite the right one.

## Pages

${pages}

## About

- Name: ${PERSON_NAME} (also known as ${PERSON_ALT})
- Role: Artist-Engineer
- Works in: ${KNOWS_ABOUT.join(', ').toLowerCase()}
- LinkedIn: https://www.linkedin.com/in/threesam/
- GitHub: https://github.com/threesam
- SoundCloud: https://soundcloud.com/threesam

## More

- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
