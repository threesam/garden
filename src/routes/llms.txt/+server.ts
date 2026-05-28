import { SITE_URL, SITE_DESCRIPTION, PERSON_NAME, PERSON_ALT, KNOWS_ABOUT } from '$lib/seo';

export const prerender = true;

// Curated digest of the site for LLMs / answer engines (see llmstxt.org).
// Kept hand-picked and concise on purpose — it's a map, not a dump.
const PAGES: Array<{ path: string; label: string; blurb: string }> = [
  {
    path: '/self',
    label: 'self',
    blurb: "Sam's story — growing up in Trenton, making art, and finding a way through.",
  },
  {
    path: '/anything-but-analog',
    label: 'anything but analog',
    blurb: 'Generative art — code-driven visual sketches.',
  },
  {
    path: '/deana',
    label: 'deana',
    blurb: 'A data-art project on 102,549 messages across 10 years — one conversation.',
  },
  { path: '/benny', label: 'benny', blurb: 'Remembering 102 Jackson Street.' },
  { path: '/dad', label: 'dad', blurb: "Stories about Sam's dad." },
  {
    path: '/shelf',
    label: 'shelf',
    blurb: 'Books, media, and the things that shape how Sam thinks.',
  },
  { path: '/thoughts', label: 'thoughts', blurb: 'Essays (work in progress).' },
  { path: '/sounds', label: 'sounds', blurb: 'Music playground (coming soon).' },
];

export function GET() {
  const pages = PAGES.map((p) => `- [${p.label}](${SITE_URL}${p.path}): ${p.blurb}`).join('\n');

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
