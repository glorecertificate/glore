import { test as setup } from '@playwright/test'

import { clearRateLimits } from './db'
import { AUTH_ROLES, authFile, login, loginWithEmail } from './helpers'
import { PERSONAS, PERSONAS_MISSING, hasPersonas, personaFile, personaUsername } from './personas'

setup.beforeAll(clearRateLimits)

for (const role of AUTH_ROLES) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await login(page, role)
    await page.context().storageState({ path: authFile(role) })
  })
}

for (const persona of PERSONAS) {
  setup(`authenticate the ${persona} persona`, async ({ page }) => {
    setup.skip(!(await hasPersonas()), PERSONAS_MISSING)
    await loginWithEmail(page, personaUsername(persona))
    await page.context().storageState({ path: personaFile(persona) })
  })
}
