declare global {
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
