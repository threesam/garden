import { readFileSync, readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STAMPED_DIRS, stampAssets } from "./asset-version";

const versions = {
  "/assets/a.webp": "11111111",
  "/assets/deep/b-c_d.mp4": "22222222",
  "/wasm/math.wasm": "33333333",
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

  it("stamps the other folder that is cached for a year", () => {
    expect(stampAssets("fetch('/wasm/math.wasm')", versions)).toBe(
      "fetch('/wasm/math.wasm?v=33333333')",
    );
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

  it("stamps an address joined to the site's origin in code", () => {
    expect(stampAssets("`${SITE_URL}/assets/a.webp`", versions)).toBe(
      "`${SITE_URL}/assets/a.webp?v=11111111`",
    );
  });

  it("leaves a path on disk and another site's address alone", () => {
    const text = "static/assets/a.webp https://cdn.example.com/assets/a.webp";
    expect(stampAssets(text, versions)).toBe(text);
  });

  it("leaves an address that runs on into an escaped character alone", () => {
    const text = "/assets/a.webp%20large";
    expect(stampAssets(text, versions)).toBe(text);
  });

  it("does nothing when there are no fingerprints, as in dev", () => {
    const text = '<img src="/assets/a.webp" />';
    expect(stampAssets(text, {})).toBe(text);
  });
});

// The two things the build cannot check for itself.
describe("the one rule", () => {
  it("fingerprints every folder vercel.json caches for a year", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      headers: { source: string; headers: { value: string }[] }[];
    };
    const immutable = config.headers
      .filter((rule) => rule.headers.some((header) => header.value.includes("immutable")))
      .map((rule) => rule.source);
    // SvelteKit names the files under _app/immutable by their contents itself.
    expect(immutable.sort()).toEqual(
      ["/_app/immutable/(.*)", ...STAMPED_DIRS.map((dir) => `/${dir}/(.*)`)].sort(),
    );
  });

  // The build stamps an address it can read. One put together as the page runs
  // (`${dir}/${n}.jpg`), or carrying a number kept by hand, is not one.
  it("has every address in src written out whole, naming a real file", () => {
    const mention = new RegExp(`(?<![\\w.-])/(?:${STAMPED_DIRS.join("|")})/[^\\s"'\`)<>,;#]*`, "g");
    const isFile = (path: string): boolean =>
      statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
    const offenders = readdirSync("src", { recursive: true, encoding: "utf8" })
      .filter((file) => /\.(svelte|ts|css)$/.test(file) && !file.endsWith(".test.ts"))
      .flatMap((file) =>
        (readFileSync(`src/${file}`, "utf8").match(mention) ?? [])
          .filter((address) => !isFile(`static${address}`))
          .map((address) => `${file}: ${address}`),
      );
    expect(offenders).toEqual([]);
  });
});
