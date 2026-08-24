import { POSTS } from "./posts";
import { SITE_PAGES } from "./seo";

export interface ExploreCard {
  href: string;
  title: string;
  blurb: string;
}

/**
 * The onward-navigation list for the "keep exploring" strip: the dated pieces
 * (POSTS) followed by the evergreen sections (SITE_PAGES), with the current
 * page removed and each destination kept once. Pieces lead because they're the
 * specific work; a section is the wider room around it.
 *
 * `order` is injected so the component can shuffle for variety while the tests
 * stay deterministic. It defaults to identity — no reordering.
 */
export function buildExploreList(
  current: string,
  order: <T>(xs: readonly T[]) => T[] = (xs) => [...xs],
): ExploreCard[] {
  const pieces: ExploreCard[] = POSTS.map((p) => ({
    href: p.path,
    title: p.title,
    blurb: p.description,
  }));
  const sections: ExploreCard[] = SITE_PAGES.map((p) => ({
    href: p.path,
    title: p.label,
    blurb: p.blurb,
  }));

  const seen = new Set<string>([current]);
  const merged: ExploreCard[] = [];
  for (const card of [...pieces, ...sections]) {
    if (seen.has(card.href)) continue;
    seen.add(card.href);
    merged.push(card);
  }
  return order(merged);
}
