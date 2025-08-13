import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const AUTH_COOKIE = 'auth';
const BYPASS_COOKIE = '__prerender_bypass';
const isProd = process.env.NODE_ENV === 'production';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password) {
      return new Response(JSON.stringify({ error: 'Missing password' }), { status: 400 });
    }

    if (!env.APP_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
    }

    if (password !== env.APP_PASSWORD) {
      await new Promise((r) => setTimeout(r, 300));
      return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }

    cookies.set(AUTH_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    if (env.BYPASS_TOKEN) {
      cookies.set(BYPASS_COOKIE, env.BYPASS_TOKEN, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
};