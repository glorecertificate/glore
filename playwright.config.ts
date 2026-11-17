import { type Project, defineConfig, devices } from '@playwright/test'

const wsEndpoint = process.env.PLAYWRIGHT_PINNED_ENDPOINT

const chromium = {
  ...devices['Desktop Chrome'],
  launchOptions: { args: process.env.CI ? ['--disable-webgl', '--disable-3d-apis'] : [] },
}

const visual = { contextOptions: { reducedMotion: 'reduce' as const } }

const pinned = {
  connectOptions: { exposeNetwork: process.env.PLAYWRIGHT_PINNED_EXPOSE, wsEndpoint: wsEndpoint ?? '' },
}

const pinnedProjects: Project[] = [
  {
    name: 'firefox',
    testMatch: /smoke\.spec\.ts/u,
    use: { ...devices['Desktop Firefox'], ...pinned },
    dependencies: ['setup'],
  },
  {
    name: 'mobile-webkit',
    testMatch: /smoke\.spec\.ts/u,
    use: { ...devices['iPhone 13'], ...pinned },
    dependencies: ['setup'],
  },
  {
    name: 'visual-desktop',
    testMatch: /\.visual\.ts/u,
    use: { ...chromium, ...visual, ...pinned, viewport: { height: 1600, width: 1280 } },
    dependencies: ['setup'],
  },
  {
    name: 'visual-mobile',
    testMatch: /\.visual\.ts/u,
    use: { ...devices['iPhone 13'], ...visual, ...pinned },
    dependencies: ['setup'],
  },
]

const playwrightConfig = defineConfig({
  testDir: 'e2e',
  outputDir: '.playwright',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  updateSnapshots: 'none',
  expect: {
    timeout: process.env.CI ? 15_000 : 20_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', stylePath: './e2e/visual.css' },
  },
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
    { name: 'setup', testMatch: /auth\.setup\.ts/u, use: chromium },
    {
      name: 'chromium',
      testIgnore: /legal\.spec\.ts/u,
      use: chromium,
      dependencies: ['setup'],
    },
    {
      name: 'legal',
      testMatch: /legal\.spec\.ts/u,
      use: chromium,
      dependencies: ['chromium'],
    },
    ...(wsEndpoint ? pinnedProjects : []),
  ],
})

export default playwrightConfig
