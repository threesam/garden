import type { RequestHandler } from './$types';
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
  const w = Math.min(Math.max(parseInt(url.searchParams.get('w') ?? '400', 10), 32), 1200);

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
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  }

  const upstream = await fetch(src);
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  const inputBuf = await upstream.arrayBuffer();
  const resizedBuf = await sharp(inputBuf)
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const data = resizedBuf.buffer.slice(
    resizedBuf.byteOffset,
    resizedBuf.byteOffset + resizedBuf.byteLength
  ) as ArrayBuffer;
  cache.set(cacheKey, { data, type: 'image/webp' });

  return new Response(data, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
