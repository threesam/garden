import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const config = {
  isr: {
    bypassToken: env.BYPASS_TOKEN,
    expiration: 60
  }
};

export const load: PageServerLoad = async () => {
  return {
    now: new Date().toISOString()
  };
};