/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 3000,
  },
  test: {
    // Pure-logic unit tests, colocated next to the module they cover.
    // Browser/e2e stays in Playwright (tests/*.spec.ts).
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
