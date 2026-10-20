import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'tmp/playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://glore.localhost',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  webServer: process.env.CI
    ? {
        command: 'pnpm exec next start --port 3000',
        url: 'http://localhost:3000/api/v1/health',
        timeout: 60_000,
      }
    : undefined,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/u },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})
