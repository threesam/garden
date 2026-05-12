// Thin typed wrapper for window.umami.track. The optional chain handles
// the brief window after page load before the afterInteractive script
// runs — early clicks no-op rather than throw.

type EventData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: EventData) => void;
    };
  }
}

export function track(name: string, data?: EventData): void {
  window.umami?.track(name, data);
}
