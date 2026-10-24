import { getContent } from "#lib/content.js";
import type { PageServerLoad } from "./$types";
import { splitMarkdownContent } from "#lib/markdown.js";

export type { ContentPart } from "#lib/markdown.js";

export const prerender = true;

export const load: PageServerLoad = async () => {
  const raw = await getContent("benny");
  const parts = raw ? splitMarkdownContent(raw) : null;
  return { parts };
};
