import { getContent } from "$lib/content";
import { markdownRenderer } from "$lib/markdown";
import { withPhaseIds } from "$lib/mouth-machine-story";
import type { PageServerLoad } from "./$types";

export const prerender = true;

export const load: PageServerLoad = async () => {
  const raw = await getContent("thoughts/love-bombed");
  const html = raw ? withPhaseIds(markdownRenderer.parse(raw) as string) : "";
  return { html };
};
