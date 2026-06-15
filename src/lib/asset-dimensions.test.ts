import { readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { assetAspect, assetDimensions } from "./asset-dimensions";

describe("assetAspect", () => {
  it("returns width/height for a known landscape asset", () => {
    // fault-lines.webp is 2000×999.
    expect(assetAspect("/assets/fault-lines.webp")).toBeCloseTo(2000 / 999, 5);
  });

  it("returns a portrait (<1) ratio for piece-of-paper — the CLS offender", () => {
    // The old VoronoiImage default was 2576/1449 (≈1.78, landscape): that is
    // literally this asset's dimensions *transposed*. The real file is
    // portrait (1449×2576), so reserving landscape space made it snap on load.
    const aspect = assetAspect("/assets/piece-of-paper.webp");
    expect(aspect).toBeCloseTo(1449 / 2576, 5);
    expect(aspect).toBeLessThan(1);
  });

  it("returns undefined for unknown assets so callers can fall back", () => {
    expect(assetAspect("/assets/not-a-real-image.webp")).toBeUndefined();
  });

  it("exposes intrinsic pixel dimensions for the inline screenshot (CLS guard)", () => {
    expect(assetDimensions["/assets/chip-malt-new-address.png"]).toEqual({
      w: 1142,
      h: 134,
    });
  });
});

// Drift guard: the map is hand-maintained, so a swapped asset would silently
// reserve the wrong box and bring CLS back (a mapped aspect disables the
// runtime onload self-correct). Assert the recorded dims still match the files.
describe("assetDimensions stays in sync with static/assets", () => {
  it.each(Object.entries(assetDimensions))(
    "%s matches its file's intrinsic dimensions",
    async (src, dim) => {
      const file = join(process.cwd(), "static", src.replace(/^\//, ""));
      const meta = await sharp(file).metadata();
      expect({ w: meta.width, h: meta.height }).toEqual({ w: dim.w, h: dim.h });
    },
  );

  it("maps every banner image used in self.md (each must reserve correct space)", async () => {
    const md = await readFile(join(process.cwd(), "content/self.md"), "utf-8");
    // Mirror +page.svelte's extraction: an image is a banner when its alt has "|".
    const bannerSrcs = [...md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)]
      .filter((m) => m[1]!.includes("|"))
      .map((m) => m[2]!);
    expect(bannerSrcs.length).toBeGreaterThan(0);
    const mapped = Object.keys(assetDimensions);
    for (const src of bannerSrcs) expect(mapped).toContain(src);
  });
});
