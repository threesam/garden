import manifest from "$lib/sounds/manifest.json";
import type { SoundsManifest } from "$lib/sounds/types";
import type { PageServerLoad } from "./$types";

export const prerender = true;

// In prod, PUBLIC_SOUNDS_BASE points at the R2 public origin so audio/covers
// serve from object storage (free egress). Unset in dev → relative paths served
// from static/. Baked into the prerendered output at build time.
export const load: PageServerLoad = () => {
  return {
    manifest: manifest as SoundsManifest,
    base: process.env.PUBLIC_SOUNDS_BASE ?? "",
  };
};
