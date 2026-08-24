import { describe, expect, it } from "vitest";
import { buildRss, type FeedItem } from "./feed";

// The feed is the one follow mechanism on the site that costs a reader nothing
// and asks for nothing back, so its correctness matters more than its size.
// These cover the three things that actually break feeds in the wild: unescaped
// markup in a title, non-RFC-822 dates, and items drifting out of date order.

const items: FeedItem[] = [
  {
    path: "/thoughts/the-peach",
    title: "the peach you have to taste it first.",
    description: "a peach, and what it taught me about proof.",
    date: "2026-06-09T00:00:00Z",
  },
  {
    path: "/thoughts/certainly-uncertain",
    title: "certainly uncertain",
    description: "on not knowing.",
    date: "2026-06-29T00:00:00Z",
  },
];

describe("buildRss", () => {
  it("emits one <item> per entry inside a single channel", () => {
    const xml = buildRss(items);
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml.match(/<channel>/g)).toHaveLength(1);
  });

  it("orders items newest first regardless of input order", () => {
    const xml = buildRss(items);
    const first = xml.indexOf("certainly uncertain");
    const second = xml.indexOf("the peach");
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second);
  });

  it("formats pubDate as RFC 822, which is what readers actually parse", () => {
    const xml = buildRss(items);
    expect(xml).toContain("<pubDate>Mon, 29 Jun 2026 00:00:00 GMT</pubDate>");
  });

  it("escapes markup in titles so one stray bracket can't void the document", () => {
    const xml = buildRss([
      { path: "/x", title: "a < b & c", description: "d > e", date: "2026-01-01T00:00:00Z" },
    ]);
    expect(xml).toContain("a &lt; b &amp; c");
    expect(xml).toContain("d &gt; e");
    expect(xml).not.toContain("a < b & c");
  });

  it("emits absolute links, since a feed is read off-site by definition", () => {
    const xml = buildRss(items);
    expect(xml).toContain("<link>https://threesam.com/thoughts/the-peach</link>");
  });

  it("survives an empty set rather than emitting a malformed channel", () => {
    const xml = buildRss([]);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
