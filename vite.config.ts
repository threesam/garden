/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { STAMPED_DIRS, stampAssets, type AssetVersions } from './src/lib/asset-version';

// A fingerprint of the bytes of every file in the folders cached for a year,
// keyed by the address it is served at.
function assetVersions(): AssetVersions {
  const files = STAMPED_DIRS.flatMap((dir) =>
    readdirSync(`static/${dir}`, { recursive: true, withFileTypes: true }),
  );
  return Object.fromEntries(
    files
      .filter((file) => file.isFile())
      .map((file) => {
        const path = join(file.parentPath, file.name);
        const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
        return [path.slice('static'.length), hash.slice(0, 8)];
      }),
  );
}

// Stamps every asset address written out in full in the source: markup, styles
// and data files alike. An address put together at run time (`${dir}/${n}.jpg`)
// is not seen, so addresses are written whole; asset-version.test.ts holds src
// to that. asset-dimensions.ts is skipped because its addresses are lookup
// keys, not links.
function fingerprintAssets(versions: AssetVersions): Plugin {
  return {
    name: 'fingerprint-assets',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/src\/.*\.(svelte|ts|css)$/.test(id) || id.endsWith('/asset-dimensions.ts')) return null;
      const stamped = stampAssets(code, versions);
      // ponytail: no source map for the edit. A stamp adds eleven characters to
      // its own line and moves nothing else; emit one (magic-string) if a
      // production stack trace ever has to land on the exact column.
      return stamped === code ? null : { code: stamped, map: null };
    },
  };
}

export default defineConfig(({ command }) => {
  // Only a build is cached for a year. Dev and unit tests see plain addresses.
  const versions = command === 'build' ? assetVersions() : {};
  return {
    plugins: [fingerprintAssets(versions), tailwindcss(), sveltekit()],
    define: {
      __ASSET_VERSIONS__: JSON.stringify(versions),
    },
    server: {
      port: 3000,
    },
    test: {
      // Pure-logic unit tests, colocated next to the module they cover.
      // Browser/e2e stays in Playwright (tests/*.spec.ts).
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
