import { defineConfig, devices } from '@playwright/test'

const perfConfig = defineConfig({
  testDir: '..',
  outputDir: '../../.playwright/perf/output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: process.env.CI ? 15_000 : 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://glore.localhost',
    ignoreHTTPSErrors: true,
    launchOptions: { args: process.env.CI ? ['--disable-webgl', '--disable-3d-apis'] : [] },
    trace: 'off',
  },
  webServer: process.env.CI
    ? [
        {
          command: 'pnpm exec next start --port 3000',
          cwd: '../..',
          url: 'http://localhost:3000/api/v1/health',
          timeout: 60_000,
        },
        ...(process.env.PERF_BASE_DIR
          ? [
              {
                command: 'pnpm exec next start --port 3001',
                cwd: process.env.PERF_BASE_DIR,
                env: {
                  APP_URL: 'http://localhost:3001',
                  ...(process.env.PERF_BASE_DATABASE_URL ? { DATABASE_URL: process.env.PERF_BASE_DATABASE_URL } : {}),
                },
                url: 'http://localhost:3001/api/v1/health',
                timeout: 60_000,
              },
            ]
          : []),
      ]
    : undefined,
  projects: [
    { name: 'setup', retries: process.env.CI ? 1 : 0, testMatch: /auth\.setup\.ts/u },
    {
      name: 'perf',
      testMatch: /\.perf\.ts$/u,
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})

export default perfConfig
