// Cache busting for static/assets, which vercel.json serves as immutable for a
// year. Every address gets `?v=` plus a fingerprint of that file's bytes, so a
// picture that is redrawn under the same name is fetched again and one that
// did not change stays cached.
//
// The build makes the fingerprints (vite.config.ts) and stamps two things with
// this one function: the source of every page, and every essay as it is read
// (content.ts). Nothing is looked up in the browser.

export type AssetVersions = Readonly<Record<string, string>>;

// A whole asset address, and only when no query follows it: one that already
// carries `?v=` is left to whoever wrote it.
const ADDRESS = /\/assets\/[\w./-]+(?![\w./?-])/g;

export function stampAssets(text: string, versions: AssetVersions): string {
  return text.replace(ADDRESS, (address) => {
    const version = versions[address];
    return version ? `${address}?v=${version}` : address;
  });
}
