import { getContent } from "$lib/content";
import { markdownRenderer } from "$lib/markdown";
import type { PageServerLoad } from "./$types";

export const prerender = true;

export const load: PageServerLoad = async () => {
  const raw = await getContent("thoughts/the-peach");
  const html = raw ? (markdownRenderer.parse(raw) as string) : "";
  return { html };
};
