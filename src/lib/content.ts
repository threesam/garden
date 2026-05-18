import { readFile } from "fs/promises";
import { join } from "path";
import { dev } from "$app/environment";

const CONTENT_DIR = join(process.cwd(), "content");

// Bounded by the number of .md files in content/ (currently ~5), so no LRU needed.
// In dev mode the cache is skipped so file edits are visible without restarting.
const cache = new Map<string, string>();

export async function getContent(slug: string): Promise<string | null> {
  try {
    if (!dev) {
      const cached = cache.get(slug);
      if (cached !== undefined) return cached;
    }
    const raw = await readFile(join(CONTENT_DIR, `${slug}.md`), "utf-8");
    if (!dev) cache.set(slug, raw);
    return raw;
  } catch {
    return null;
  }
}
