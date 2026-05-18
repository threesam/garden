import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
    alias: {
      $components: 'src/lib/components',
      $lib: 'src/lib',
    },
    inlineStyleThreshold: 8192,
    prerender: {
      // OG images and other linked assets may not exist as static files
      // (they are served dynamically or externally in production). Warn
      // instead of failing the build.
      handleHttpError: 'warn',
    },
  },
};
