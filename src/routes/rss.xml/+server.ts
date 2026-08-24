import { buildRss } from "$lib/feed";
import { POSTS } from "$lib/posts";

export const prerender = true;

export function GET() {
  return new Response(buildRss(POSTS), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
