import { describe, expect, it } from "vitest";
import {
  SITE_URL,
  breadcrumbNode,
  buildGraph,
  itemListNode,
  jsonLdToScript,
  musicPlaylistNode,
  resolveTitle,
} from "./seo";

// Pure functions over JS objects — moved here from the Playwright suite so the
// schema contract runs in milliseconds without a browser. Each test verifies
// the shape an answer engine actually expects (correct @type, item count,
// cross-links to the shared Person via @id).

describe("seo node builders", () => {
  it("breadcrumbNode emits a BreadcrumbList with one ListItem per step", () => {
    const trail = [
      { path: "/", name: "threesam" },
      { path: "/shelf", name: "shelf" },
    ];
    const node = breadcrumbNode(trail) as Record<string, unknown>;
    expect(node["@type"]).toBe("BreadcrumbList");
    const items = node["itemListElement"] as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    expect(items[0]!["position"]).toBe(1);
    expect(items[1]!["position"]).toBe(2);
    expect(items[1]!["item"]).toBe(`${SITE_URL}/shelf`);
  });

  it("itemListNode wraps {url, name} pairs as ItemList ListItems", () => {
    const node = itemListNode({
      path: "/shelf",
      name: "shelf — threesam",
      items: [
        { url: "https://example.com/book-1", name: "Book One" },
        { url: "https://example.com/book-2", name: "Book Two" },
      ],
    }) as Record<string, unknown>;
    expect(node["@type"]).toBe("ItemList");
    const items = node["itemListElement"] as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    expect(items[0]!["position"]).toBe(1);
    expect(items[1]!["url"]).toBe("https://example.com/book-2");
  });

  it("musicPlaylistNode emits MusicPlaylist with numbered MusicRecording tracks", () => {
    const node = musicPlaylistNode({
      path: "/sounds",
      name: "sounds — threesam",
      tracks: [{ name: "track-1", url: "/sounds#t1" }, { name: "track-2" }],
    }) as Record<string, unknown>;
    expect(node["@type"]).toBe("MusicPlaylist");
    expect(node["numTracks"]).toBe(2);
    const tracks = node["track"] as Record<string, unknown>[];
    expect(tracks[0]!["@type"]).toBe("MusicRecording");
    expect(tracks[0]!["position"]).toBe(1);
    expect(tracks[0]!["url"]).toBe(`${SITE_URL}/sounds#t1`);
    // No url for track 2 → key omitted, not undefined.
    expect("url" in tracks[1]!).toBe(false);
  });

  it("buildGraph always emits Person + WebSite plus the page node(s)", () => {
    const pageNode = { "@type": "Article", "@id": "x" };
    const graph = buildGraph(pageNode) as Record<string, unknown>;
    expect(graph["@context"]).toBe("https://schema.org");
    const nodes = graph["@graph"] as Record<string, unknown>[];
    expect(nodes).toHaveLength(3);
    expect(nodes[0]!["@type"]).toBe("Person");
    expect(nodes[1]!["@type"]).toBe("WebSite");
    expect(nodes[2]).toBe(pageNode);
  });
});

describe("jsonLdToScript", () => {
  it("neutralises `<` so a </script> payload can't close the inline tag", () => {
    const out = jsonLdToScript({ name: "x</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script");
  });
});

describe("resolveTitle", () => {
  it("suffixes the brand for page titles and falls back bare", () => {
    expect(resolveTitle("shelf")).toBe("shelf — threesam");
    expect(resolveTitle(undefined)).toBe("threesam");
  });
});
