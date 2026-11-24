import { expect, test } from '@playwright/test'

import { hydrated } from './helpers'
import { type Tenant, createTenant, removeTenant, tenantLogin } from './tenant'

test.use({ storageState: { cookies: [], origins: [] } })

let tenant: Tenant

test.beforeAll(async () => {
  tenant = await createTenant('org-settings', [{ key: 'owner', role: 'admin' }])
})

test.afterAll(async () => {
  if (tenant) await removeTenant(tenant)
})

test('saves the organization settings and keeps the save bar out of the page when nothing changed', async ({
  page,
}) => {
  await tenantLogin(page, tenant.users.owner!)
  await page.goto('/organization?tab=settings')
  const region = page.getByLabel('Region', { exact: true })
  const description = page.getByRole('textbox', { name: 'Description in English' })
  const bar = page.locator('[data-slot="sticky-save-bar"]')
  await hydrated(region)
  await expect(bar).toBeHidden()

  await region.fill('Lombardy')
  await description.fill('A description from the settings test.')
  await expect(bar).toContainText('2 unsaved changes')
  await bar.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Organization updated')).toBeVisible()
  await expect(bar).toBeHidden()

  await page.reload()
  await expect(region).toHaveValue('Lombardy')
  await expect(description).toHaveValue('A description from the settings test.')
})
