export const SITE_URL = "https://threesam.com";

export const SITE_DESCRIPTION =
  "Artist-engineer creating at the intersection of sound, code, and human performance.";

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}

export function resolveTitle(title: string | undefined): string {
  if (!title) return 'threesam';
  return `${title} — threesam`;
}

export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: "Sam D'Angelo",
  alternateName: 'threesam',
  url: SITE_URL,
  jobTitle: 'Artist-Engineer',
  sameAs: [
    'https://github.com/threesam',
    'https://soundcloud.com/threesam',
  ],
};

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'threesam',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: { '@type': 'Person', name: "Sam D'Angelo", url: SITE_URL },
};
