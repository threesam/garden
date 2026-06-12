import manifest from "$lib/sounds/manifest.json";
import type { SoundsManifest } from "$lib/sounds/types";
import { env } from "$env/dynamic/public";
import type { PageServerLoad } from "./$types";

export const prerender = true;

// PUBLIC_SOUNDS_BASE points at the R2 public origin so audio/covers serve from
// object storage (free egress). Read via $env (not raw process.env) so it also
// resolves from .env / .env.local in local dev, not just the Vercel build env.
// Unset → relative paths served from static/. Baked into the prerender at build.
export const load: PageServerLoad = () => {
  return {
    // The JSON import types `source` as plain string; the cast narrows it to
    // the AudioSource union. eslint's project service sees the assertion as
    // unnecessary, but svelte-check (and the Song consumers) require it.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    manifest: manifest as SoundsManifest,
    base: env["PUBLIC_SOUNDS_BASE"] ?? "",
  };
};
