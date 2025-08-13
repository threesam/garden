import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const AUTH_COOKIE = 'auth';
const BYPASS_COOKIE = '__prerender_bypass';
const isProd = process.env.NODE_ENV === 'production';

export const handle: Handle = async ({ event, resolve }) => {
  const authCookie = event.cookies.get(AUTH_COOKIE);
  const isAuthenticated = authCookie === '1';
  event.locals.isAuthenticated = isAuthenticated;

  const response = await resolve(event);

  if (isAuthenticated) {
    if (env.BYPASS_TOKEN) {
      event.cookies.set(BYPASS_COOKIE, env.BYPASS_TOKEN, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 60 * 60 * 24 * 7
      });
    }
  } else {
    event.cookies.delete(BYPASS_COOKIE, { path: '/' });
  }

  return response;
};