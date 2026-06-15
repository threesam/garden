import { describe, expect, it } from "vitest";
import { markdownRenderer, splitMarkdownContent } from "./markdown";

const render = (md: string): string => markdownRenderer.parse(md) as string;

describe("image renderer", () => {
  it("escapes double quotes in alt text so they can't break out of the attribute", () => {
    const html = render('![the "peach" moment](/assets/peach.jpg)');
    // The raw quote must not terminate the alt attribute…
    expect(html).not.toContain('alt="the "');
    // …and the text survives, entity-escaped.
    expect(html).toContain("alt=\"the &quot;peach&quot; moment\"");
  });

  it("emits width/height for images with known intrinsic dimensions (CLS guard)", () => {
    const html = render("![chip](/assets/chip-malt-new-address.png)");
    expect(html).toContain('width="1142"');
    expect(html).toContain('height="134"');
  });

  it("omits width/height for unknown images", () => {
    const html = render("![x](/assets/unknown.jpg)");
    expect(html).not.toContain("width=");
  });

  it("keeps inline images inside the section padding, centered (no edge bleed)", () => {
    const html = render("![chip](/assets/chip-malt-new-address.png)");
    // Sits at content width within the section's padding (aligned with the body
    // text), not bled to the edges with negative side-margins.
    expect(html).toContain("w-full");
    expect(html).not.toContain("-mx-");
    expect(html).not.toContain("bleed-x");
  });

  it("renders the pipe syntax as a captioned banner with color and position", () => {
    const html = render("![heading text|coral|bottom right](/assets/banner.jpg)");
    expect(html).toContain("style=\"color: coral\"");
    expect(html).toContain("bottom-6");
    expect(html).toContain("text-right");
    expect(html).toContain(">heading text</span>");
  });

  it("defaults banner color/position when pipes omit them", () => {
    const html = render("![only heading|](/assets/banner.jpg)");
    expect(html).toContain("style=\"color: white\"");
    expect(html).toContain("top-6");
  });
});

describe("link renderer", () => {
  it("opens external links in a new tab with rel protection", () => {
    const html = render("[ext](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps internal links same-tab", () => {
    const html = render("[in](/shelf)");
    expect(html).not.toContain("target=");
  });
});

describe("splitMarkdownContent", () => {
  it("splits html around <!-- slot --> markers and names the slots", () => {
    const parts = splitMarkdownContent("before\n\n<!-- soundcloud -->\n\nafter");
    expect(parts.map((p) => p.type)).toEqual(["html", "slot", "html"]);
    const slot = parts[1]!;
    if (slot.type !== "slot") throw new Error("expected slot");
    expect(slot.name).toBe("soundcloud");
  });

  it("returns a single html part when there are no markers", () => {
    const parts = splitMarkdownContent("just text");
    expect(parts).toHaveLength(1);
    expect(parts[0]!.type).toBe("html");
  });
});
