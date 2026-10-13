import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { assetDimensions } from "./asset-dimensions";
import {
  BARS,
  TURNS,
  chorus,
  cover,
  coverStills,
  song,
  timeline,
  visual,
  words,
} from "./love-bombed-story";
import { markdownRenderer } from "./markdown";
import { withPhaseIds } from "./mouth-machine-story";

// Drift guard: the page takes the finished piece apart by hand. The words have
// to be the words on screen, the timeline has to fit the piece, and every file
// it names has to be there.
const root = process.cwd();
const inStatic = (src: string) => existsSync(join(root, "static", src));

describe("love bombed story stays true to the piece", () => {
  it("has the words exactly as the captions file has them", () => {
    const vtt = readFileSync(
      join(root, "static/assets/love-bombed/love-bombed.vtt"),
      "utf8",
    );
    const cues = vtt
      .split("\n\n")
      .slice(1)
      .map((c) => c.trim().split("\n").slice(1).join(" "))
      .filter((t) => t && !t.startsWith("["));
    expect(cues).toEqual(words);
  });

  it("keeps every stretch of the timeline inside the piece", () => {
    for (const row of timeline)
      for (const s of row.spans) {
        expect(s.from).toBeGreaterThanOrEqual(0);
        expect(s.from + s.len).toBeLessThanOrEqual(BARS);
        if (s.n) expect(song[s.n - 1], `guitar clip ${s.n}`).toBeDefined();
      }
  });

  it("names only files that exist, each once", () => {
    const clips = [...song, ...visual, chorus, cover];
    const srcs = [...clips, ...coverStills].map((m) => m.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const c of clips) {
      expect(inStatic(c.src), c.src).toBe(true);
      expect(inStatic(c.poster), c.poster).toBe(true);
    }
    for (const s of coverStills) {
      expect(inStatic(s.src), s.src).toBe(true);
      expect(assetDimensions[s.src], s.src).toBeDefined();
    }
  });

  it("anchors every phase of the raw log and nothing else", () => {
    const log = readFileSync(
      join(root, "content/thoughts/love-bombed.md"),
      "utf8",
    );
    const html = withPhaseIds(markdownRenderer.parse(log) as string);
    expect(html.match(/<h2 id="phase-\d+"/g)).toHaveLength(TURNS);
  });
});
