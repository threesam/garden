import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  // R2 public origin for /sounds audio + covers. Unset → '' → relative paths
  // served from static/. Baked into the prerender at build.
  PUBLIC_SOUNDS_BASE: { public: true, schema: (input) => input ?? '' },
});
