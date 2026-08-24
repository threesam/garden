import { describe, expect, it } from "vitest";
import { buildExploreList } from "./explore";

// The strip's whole job is "somewhere else to go," so the two things that would
// break it are a card pointing at the page you're already on, or the same
// destination twice. Order is injected here so the assertions don't fight a
// shuffle.
const identity = <T>(xs: readonly T[]): T[] => [...xs];

describe("buildExploreList", () => {
  it("never includes the current page", () => {
    const list = buildExploreList("/thoughts/the-peach", identity);
    expect(list.every((c) => c.href !== "/thoughts/the-peach")).toBe(true);
  });

  it("emits each destination at most once", () => {
    const list = buildExploreList("/anything-but-analog/physarum", identity);
    const hrefs = list.map((c) => c.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps a piece even when its parent section is also listed", () => {
    // physarum lives under /anything-but-analog; both should be reachable from
    // an essay, since one is the specific work and the other is the gallery.
    const hrefs = buildExploreList("/thoughts/the-peach", identity).map((c) => c.href);
    expect(hrefs).toContain("/anything-but-analog/physarum");
    expect(hrefs).toContain("/anything-but-analog");
  });

  it("routes every card to a real internal path with a title and blurb", () => {
    for (const c of buildExploreList("/", identity)) {
      expect(c.href.startsWith("/")).toBe(true);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
    }
  });

  it("applies the injected ordering (so the component can shuffle)", () => {
    const reversed = buildExploreList("/", (xs) => [...xs].reverse());
    const forward = buildExploreList("/", identity);
    expect(reversed.map((c) => c.href)).toEqual([...forward.map((c) => c.href)].reverse());
  });
});
