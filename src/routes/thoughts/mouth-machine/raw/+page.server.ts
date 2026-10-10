import { getContent } from "$lib/content";
import { markdownRenderer } from "$lib/markdown";
import { withPhaseIds } from "$lib/mouth-machine-story";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const raw = await getContent("thoughts/mouth-machine");
  const html = raw ? withPhaseIds(markdownRenderer.parse(raw) as string) : "";
  return { html };
};
