// Thin wrapper around the Umami client. Umami's script is loaded in
// layout.tsx with `strategy="afterInteractive"`, so it may not be on
// `window` for the first few frames; the optional chaining swallows
// those early calls silently rather than logging — analytics shouldn't
// add noise to the console.

type EventData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: EventData) => void;
    };
  }
}

export function track(name: string, data?: EventData): void {
  if (typeof window === "undefined") return;
  window.umami?.track(name, data);
}
