import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { assetDimensions } from "./asset-dimensions";
import { markdownRenderer } from "./markdown";
import { TURNS, layers } from "./love-bombed-story";
import { withPhaseIds } from "./mouth-machine-story";

// Drift guard: the story is a hand-written distillation of the raw log. Sam's
// words are quoted, so they have to be the words in the log, letter for letter.
const log = readFileSync(
  join(process.cwd(), "content/thoughts/love-bombed.md"),
  "utf8",
);
const rawHtml = withPhaseIds(markdownRenderer.parse(log) as string);
const inStatic = (src: string) => existsSync(join(process.cwd(), "static", src));

describe("love bombed story stays true to the raw log", () => {
  it.each(layers.map((l) => l.ask))(
    "Sam's ask is in the log verbatim: %s",
    (ask) => {
      expect(log).toContain(`"${ask}`);
    },
  );

  it("links only to phases the raw page has an anchor for", () => {
    const phases = layers.flatMap((l) => l.phases);
    for (const n of phases) expect(rawHtml).toContain(`<h2 id="phase-${n}" `);
  });

  it("anchors every phase heading and nothing else", () => {
    expect(rawHtml.match(/<h2 id="phase-\d+"/g)).toHaveLength(TURNS);
  });

  it("uses each piece of creative once, and every file exists", () => {
    const srcs = layers.flatMap((l) => l.media.map((m) => m.src));
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const m of layers.flatMap((l) => l.media)) {
      expect(inStatic(m.src), m.src).toBe(true);
      if (m.kind === "clip") expect(inStatic(m.poster), m.poster).toBe(true);
      else {
        expect(assetDimensions[m.src], m.src).toBeDefined();
        if (m.sound) expect(inStatic(m.sound), m.sound).toBe(true);
      }
    }
  });

  it("keeps headings free of ending punctuation", () => {
    for (const l of layers) expect(l.title).not.toMatch(/[.,:;!]$/);
  });
});
