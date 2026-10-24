import { readFile } from "fs/promises";
import { join } from "path";
import { dev } from "$app/env";
import { stampAssets } from "#lib/asset-version.js";

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
    // Every picture an essay names gets its fingerprint here, once per essay.
    const raw = stampAssets(
      await readFile(join(CONTENT_DIR, `${slug}.md`), "utf-8"),
      __ASSET_VERSIONS__,
    );
    if (!dev) cache.set(slug, raw);
    return raw;
  } catch {
    return null;
  }
}
