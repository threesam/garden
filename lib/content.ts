import { readFile } from "fs/promises";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "content");

export async function getContent(slug: string): Promise<string | null> {
  try {
    return await readFile(join(CONTENT_DIR, `${slug}.md`), "utf-8");
  } catch {
    return null;
  }
}
