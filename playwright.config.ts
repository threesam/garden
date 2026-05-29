import { defineConfig, devices } from '@playwright/test';

// Preview port is configurable so concurrent git worktrees don't collide on 3000.
const PORT = Number(process.env.PREVIEW_PORT ?? 3000);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.005 } },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: `pnpm preview --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  ],
});
