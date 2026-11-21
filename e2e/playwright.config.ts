import { defineConfig, devices } from '@playwright/test';
import { EyesFixture } from '@applitools/eyes-playwright/fixture';

export default defineConfig<EyesFixture>({
  testDir: './tests',
  // Visual tests can queue on Eyes concurrency limits.
  timeout: 5 * 60 * 1000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['@applitools/eyes-playwright/reporter'],
  ],
  use: {
    baseURL: process.env.VIEWER_URL ?? 'http://localhost:8080/',
    headless: false,
    launchOptions: { slowMo: 500 }, // slow enough to watch along
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    eyesConfig: {
      apiKey: process.env.APPLITOOLS_API_KEY,
      appName: 'Workbook Viewer',
      batch: { name: process.env.EYES_BATCH_NAME ?? 'Workbook Viewer - seeded workbook' },
      matchLevel: 'Strict',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
});
