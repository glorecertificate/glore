import { test as setup } from '@playwright/test'

import { clearRateLimits } from './db'
import { AUTH_ROLES, authFile, login } from './helpers'

const BASE_URL = process.env.PERF_BASE_URL

setup.beforeAll(async () => {
  await clearRateLimits()
  if (BASE_URL) await clearRateLimits(process.env.PERF_BASE_DATABASE_URL)
})

for (const role of AUTH_ROLES) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await login(page, role)
    await page.context().storageState({ path: authFile(role) })
  })

  setup(`authenticate ${role} on the base`, async ({ browser }) => {
    setup.skip(!BASE_URL, 'No base server')
    const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true })
    const page = await context.newPage()
    await login(page, role)
    await context.storageState({ path: authFile(role, 'base') })
    await context.close()
  })
}
