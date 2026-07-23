import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.HTH_BASE_URL || 'http://localhost:8888';
const outputDir = process.env.HTH_EVIDENCE_DIR || 'evidence/installed-five-application';

export default defineConfig({
  testDir: './specs',
  outputDir: `${outputDir}/test-results`,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: `${outputDir}/playwright-report.json` }],
    ['html', { outputFolder: `${outputDir}/html-report`, open: 'never' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true,
    serviceWorkers: 'block'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'chromium-nojs',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false }
    },
    {
      name: 'print-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
