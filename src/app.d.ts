declare global {
  /** A fingerprint for each file under static/assets; empty outside a build. See vite.config.ts. */
  const __ASSET_VERSIONS__: Readonly<Record<string, string>>;
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number | boolean | undefined>) => void;
    };
  }
}

declare module 'svelte/elements' {
  interface HTMLVideoAttributes {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

export {};
