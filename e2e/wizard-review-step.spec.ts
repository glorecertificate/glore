import { expect, test } from '@playwright/test'

import { type Actor, actAs, fillExperience, pickSkills, rateOrganization } from './actors'
import { type Tenant, createTenant, removeTenant } from './tenant'

test.describe.configure({ timeout: 90_000 })

let tenant: Tenant
let volunteer: Actor

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('wizard', [{ completedSkills: 3, key: 'volunteer', role: 'volunteer' }])
  volunteer = await actAs(browser, tenant.users.volunteer!)
})

test.afterAll(async () => {
  await volunteer?.close()
  if (tenant) await removeTenant(tenant)
})

test.fixme('moving to the review step does not submit the request (app bug: wizard.tsx flips the Continue button to submit mid click)', async () => {
  const { page } = volunteer
  await page.goto('/certificates/new')
  await fillExperience(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await pickSkills(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await rateOrganization(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('button', { name: 'Submit request' })).toBeVisible()
  await expect(page).not.toHaveURL(/\/certificates\/\d+$/u)
})
