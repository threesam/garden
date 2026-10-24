import { getContent } from '#lib/content.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
  const markdown = await getContent('self');
  return { markdown };
};
