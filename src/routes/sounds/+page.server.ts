import manifest from "$lib/sounds/manifest.json";
import type { SoundsManifest } from "$lib/sounds/types";
import type { PageServerLoad } from "./$types";

export const prerender = true;

export const load: PageServerLoad = () => {
  return { manifest: manifest as SoundsManifest };
};
