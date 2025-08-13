import type { RequestHandler } from '@sveltejs/kit';

const AUTH_COOKIE = 'auth';
const BYPASS_COOKIE = '__prerender_bypass';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete(AUTH_COOKIE, { path: '/' });
  cookies.delete(BYPASS_COOKIE, { path: '/' });
  return new Response(null, { status: 204 });
};