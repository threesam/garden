import { getContent } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const markdown = await getContent('self');
  return { markdown };
};
