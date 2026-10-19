import { test as setup } from '@playwright/test'

import { AUTH_ROLES, authFile, login } from './helpers'

for (const role of AUTH_ROLES) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await login(page, role)
    await page.context().storageState({ path: authFile(role) })
  })
}
