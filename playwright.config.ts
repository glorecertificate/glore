import { defineConfig, devices } from '@playwright/test'

const BROWSERS = (process.env.E2E_BROWSERS ?? 'chromium').split(',')
const SMOKE = /(?:accessibility|locales|logout|smoke|verify)\.spec\.ts/u

const CHROMIUM = { launchOptions: { args: process.env.CI ? ['--disable-webgl', '--disable-3d-apis'] : [] } }

const BROWSER_PROJECTS = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'], ...CHROMIUM }, dependencies: ['setup'] },
  { name: 'webkit', testMatch: SMOKE, use: { ...devices['iPhone 13'] }, dependencies: ['setup'] },
  { name: 'firefox', testMatch: SMOKE, use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
]

const playwrightConfig = defineConfig({
  testDir: 'e2e',
  outputDir: '.playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: process.env.CI ? 15_000 : 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://glore.localhost',
    ignoreHTTPSErrors: true,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },
  webServer: process.env.CI
    ? {
        command: 'pnpm exec next start --port 3000',
        url: 'http://localhost:3000/api/v1/health',
        timeout: 60_000,
      }
    : undefined,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/u, use: CHROMIUM },
    ...BROWSER_PROJECTS.filter(project => BROWSERS.includes(project.name)),
  ],
})

export default playwrightConfig
