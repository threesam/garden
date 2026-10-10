import { describe, expect, it } from "vitest";
import { stampAssets } from "./asset-version";

const versions = {
  "/assets/a.webp": "11111111",
  "/assets/deep/b-c_d.mp4": "22222222",
};

describe("stampAssets", () => {
  it("adds the fingerprint to a known asset address", () => {
    expect(stampAssets('<img src="/assets/a.webp" />', versions)).toBe(
      '<img src="/assets/a.webp?v=11111111" />',
    );
  });

  it("stamps every address in the text, in markdown and CSS alike", () => {
    expect(
      stampAssets("![x](/assets/a.webp) url(/assets/deep/b-c_d.mp4)", versions),
    ).toBe("![x](/assets/a.webp?v=11111111) url(/assets/deep/b-c_d.mp4?v=22222222)");
  });

  it("puts the fingerprint before a fragment", () => {
    expect(stampAssets("/assets/deep/b-c_d.mp4#t=3", versions)).toBe(
      "/assets/deep/b-c_d.mp4?v=22222222#t=3",
    );
  });

  it("leaves an address that already carries a query alone", () => {
    const text = "/assets/a.webp?v=7";
    expect(stampAssets(text, versions)).toBe(text);
  });

  it("leaves unknown files and half-built addresses alone", () => {
    const text = "/assets/nope.webp /assets/a.webpx /assets/deep/${name}.webp";
    expect(stampAssets(text, versions)).toBe(text);
  });

  it("stamps an address that follows an origin", () => {
    expect(stampAssets("https://threesam.com/assets/a.webp", versions)).toBe(
      "https://threesam.com/assets/a.webp?v=11111111",
    );
  });

  it("does nothing when there are no fingerprints, as in dev", () => {
    const text = '<img src="/assets/a.webp" />';
    expect(stampAssets(text, {})).toBe(text);
  });
});
