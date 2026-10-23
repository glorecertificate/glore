import { expect, test } from '@playwright/test'

import { type Actor, actAs } from './actors'
import { authFile } from './helpers'
import { type Tenant, createTenant, removeTenant, seedRequest } from './tenant'

test.describe.configure({ timeout: 90_000 })

test.describe('volunteer eligibility', () => {
  test.describe.configure({ mode: 'serial' })

  let tenant: Tenant
  let fresh: Actor
  let partial: Actor
  let open: Actor
  let requestId = 0

  test.beforeAll(async ({ browser }) => {
    tenant = await createTenant('eligible', [
      { completedSkills: 0, key: 'fresh', role: 'volunteer' },
      { completedSkills: 1, key: 'partial', role: 'volunteer' },
      { completedSkills: 3, key: 'open', role: 'volunteer' },
    ])
    requestId = (await seedRequest({ author: tenant.users.open!, status: 'submitted', tenant })).id
    fresh = await actAs(browser, tenant.users.fresh!)
    partial = await actAs(browser, tenant.users.partial!)
    open = await actAs(browser, tenant.users.open!)
  })

  test.afterAll(async () => {
    await fresh?.close()
    await partial?.close()
    await open?.close()
    if (tenant) await removeTenant(tenant)
  })

  test('a volunteer without skill courses is told what is missing and sent to the courses', async () => {
    const { page } = fresh
    await page.goto('/certificates/new')
    await expect(page.getByText('You are not ready to request a certificate yet')).toBeVisible()
    await expect(page.getByText('Complete 3 skill courses')).toBeVisible()
    await expect(page.getByText('0 of 3 completed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit request' })).toBeHidden()
    await page.getByRole('link', { name: 'Go to courses' }).click()
    await expect(page).toHaveURL(/\/courses/u)
  })

  test('a volunteer with some skill courses sees the progress toward the requirement', async () => {
    const { page } = partial
    await page.goto('/certificates/new')
    await expect(page.getByText('You are not ready to request a certificate yet')).toBeVisible()
    await expect(page.getByText('1 of 3 completed')).toBeVisible()
    await page.getByRole('link', { name: 'Back to certificates' }).click()
    await expect(page).toHaveURL(/\/certificates$/u)
  })

  test('a volunteer with an open request cannot start another and can follow the open one', async () => {
    const { page } = open
    await page.goto('/certificates/new')
    await expect(page.getByText('You already have an open request')).toBeVisible()
    await page.getByRole('link', { name: 'View request' }).click()
    await expect(page).toHaveURL(new RegExp(`/certificates/${requestId}$`, 'u'))
  })
})

test.describe('learner', () => {
  test.use({ storageState: authFile('learner') })

  test('has no Certificates entry in the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Courses', exact: true }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Certificates', exact: true })).toBeHidden()
  })

  test.fixme('cannot open the certificates area by URL (app bug: certificates layout only blocks editors)', async ({
    page,
  }) => {
    for (const path of ['/certificates', '/certificates/new']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'Not found' }), path).toBeVisible()
    }
  })
})
