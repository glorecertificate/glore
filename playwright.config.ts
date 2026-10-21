import { defineConfig, devices } from '@playwright/test'

const playwrightConfig = defineConfig({
  testDir: 'e2e',
  outputDir: '.playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: process.env.CI ? 5000 : 20_000 },
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

export default playwrightConfig
