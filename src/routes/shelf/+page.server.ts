import sharp from "sharp";
import { getBooks, type Book } from "$lib/goodreads";
import type { PageServerLoad } from "./$types";

export const prerender = true;

const CURRENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90;

// Cover-probing tuning. Bounded concurrency + per-fetch timeout keep the
// prerender build fast and resilient: any failure leaves dims undefined.
const PROBE_CONCURRENCY = 8;
const PROBE_TIMEOUT_MS = 8000;

/**
 * Fetch a cover and read its real pixel dimensions via sharp. Resolves to
 * undefined on any error (network, timeout, decode) so the build never fails.
 */
async function probeCoverDims(
  url: string,
): Promise<{ coverW: number; coverH: number } | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => { controller.abort(); }, PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    const { width, height } = await sharp(buf).metadata();
    if (!width || !height) return undefined;
    return { coverW: width, coverH: height };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe real cover dimensions for a set of books in place, with bounded
 * concurrency. Mutates each book's coverW/coverH when probing succeeds.
 */
async function attachCoverDims(books: Book[]): Promise<void> {
  const targets = books.filter((b) => b.coverUrl);
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const book = targets[cursor++]!;
      const dims = await probeCoverDims(book.coverUrl);
      if (dims) {
        book.coverW = dims.coverW;
        book.coverH = dims.coverH;
      }
    }
  };
  const pool = Array.from({ length: Math.min(PROBE_CONCURRENCY, targets.length) }, worker);
  await Promise.all(pool);
}

export const load: PageServerLoad = async () => {
  const [currentlyReading, read] = await Promise.all([
    getBooks("currently-reading"),
    getBooks("read"),
  ]);

  const sorted = [...read].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

  const cutoff = Date.now() - CURRENT_MAX_AGE_MS;
  const currentBook =
    currentlyReading
      .filter((b) => b.addedAt.getTime() > cutoff)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())[0] ?? null;

  const lastRead =
    [...read]
      .filter((b) => b.readAt)
      .sort((a, b) => b.readAt!.getTime() - a.readAt!.getTime())[0] ??
    sorted[0] ??
    null;

  const featured = currentBook ?? lastRead;
  const featuredLabel = currentBook ? "currently reading" : "last read";

  // Probe real cover dimensions at build time so the client can declare the
  // correct intrinsic aspect ratio (fixes CLS + Lighthouse image audits).
  // `featured` is one of the sorted/currentlyReading books, so include it.
  const toProbe = featured && !sorted.includes(featured) ? [...sorted, featured] : sorted;
  await attachCoverDims(toProbe);

  return {
    sorted,
    featured,
    featuredLabel,
  };
};
