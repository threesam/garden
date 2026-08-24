import type { FeedItem } from "./feed";

/**
 * Dated, followable work — the things a reader would want to hear about when
 * they land. Not every route belongs here: the evergreen pages (/self, /shelf,
 * /sounds) are in SITE_PAGES, which is the site index. This is the timeline.
 *
 * Single source for the feed and for the dated half of the sitemap. Those two
 * used to carry their own copies of these dates and had already drifted.
 *
 * Newest first by convention; `buildRss` sorts anyway, so an out-of-order entry
 * is a tidiness problem rather than a bug.
 */
export const POSTS: FeedItem[] = [
  {
    path: "/anything-but-analog/physarum",
    title: "slime moulds",
    description:
      "Two slime moulds simulated in Rust and rendered off the main thread: a physarum transport network that grows toward food you place, and dictyostelium relaying cAMP into spiral waves.",
    date: "2026-08-07T00:00:00Z",
  },
  {
    path: "/thoughts/certainly-uncertain",
    title: "certainly uncertain",
    description: "crush the chips.",
    date: "2026-06-29T00:00:00Z",
  },
  {
    path: "/thoughts/the-peach",
    title: "the peach",
    description: "you have to taste it first.",
    date: "2026-06-09T00:00:00Z",
  },
];
