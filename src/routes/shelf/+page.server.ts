import { getBooks } from "$lib/goodreads";
import type { PageServerLoad } from "./$types";

const CURRENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90;

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

  return {
    sorted,
    featured,
    featuredLabel,
  };
};
