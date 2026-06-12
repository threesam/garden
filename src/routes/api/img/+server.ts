import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import sharp from 'sharp';
import { createTtlCache } from '$lib/server/ttl-cache';

// Allowed origin hosts — prevents open redirect abuse.
const ALLOWED_HOSTS = new Set(['images.gr-assets.com', 'i.gr-assets.com', 's.gr-assets.com']);

// In-memory response cache keyed by url+width; bounded to 500 entries.
const cache = createTtlCache<{ data: ArrayBuffer; type: string }>({
  ttlMs: 86400 * 1000,
  maxEntries: 500,
});

export const GET: RequestHandler = async ({ url }) => {
  const src = url.searchParams.get('url');
  const wRaw = Number(url.searchParams.get('w'));
  const w = Number.isFinite(wRaw) ? Math.min(Math.max(wRaw, 32), 1200) : 400;

  if (!src) return new Response('missing url', { status: 400 });

  let origin: string;
  try {
    origin = new URL(src).hostname;
  } catch {
    return new Response('invalid url', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(origin)) {
    return new Response('disallowed origin', { status: 403 });
  }

  const cacheKey = `${src}@${w}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    return new Response(hit.data, {
      headers: {
        'Content-Type': hit.type,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  }

  const upstream = await fetch(src);
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  const inputBuf = await upstream.arrayBuffer();

  let resizedBuf: Buffer;
  try {
    resizedBuf = await sharp(inputBuf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error('[api/img] sharp pipeline failed', { src, w, err });
    error(502, 'image processing failed');
  }

  const data = resizedBuf.buffer.slice(
    resizedBuf.byteOffset,
    resizedBuf.byteOffset + resizedBuf.byteLength
  ) as ArrayBuffer;
  cache.set(cacheKey, { data, type: 'image/webp' });

  return new Response(data, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
};
