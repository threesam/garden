import { defineConfig, devices } from '@playwright/test';

// Preview port is configurable so concurrent git worktrees don't collide on 3000.
const PORT = Number(process.env['PREVIEW_PORT']) || 3000;
// Point the suite at a deployed origin (e.g. VISUAL_BASE_URL=https://threesam.com)
// to capture or verify baselines against prod; unset → the local preview build.
const EXTERNAL_BASE = process.env['VISUAL_BASE_URL'];

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.005 } },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  // Only spin up the local preview when testing locally; against an external
  // origin there's nothing to serve.
  ...(EXTERNAL_BASE
    ? {}
    : {
        webServer: {
          command: `pnpm preview --port ${PORT}`,
          port: PORT,
          reuseExistingServer: !process.env['CI'],
          timeout: 60_000,
        },
      }),
  use: {
    baseURL: EXTERNAL_BASE || `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  ],
});
