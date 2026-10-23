import { expect, test } from '@playwright/test'

import { type Actor, actAs, tenantNames } from './actors'
import { type Tenant, certificateRow, createTenant, removeTenant, seedRequest } from './tenant'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let tenant: Tenant
let tutor: Actor
let pooled = 0
let stale = 0
let rejected = 0

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('queue', [
    { key: 'tutor', role: 'tutor' },
    { completedSkills: 3, key: 'pooled', role: 'volunteer' },
    { completedSkills: 3, key: 'stale', role: 'volunteer' },
    { completedSkills: 3, key: 'rejected', role: 'volunteer' },
    { completedSkills: 3, key: 'done', role: 'volunteer' },
  ])
  pooled = (await seedRequest({ author: tenant.users.pooled!, status: 'submitted', tenant })).id
  stale = (
    await seedRequest({
      author: tenant.users.stale!,
      daysAgo: 9,
      reviewer: tenant.users.tutor!,
      status: 'submitted',
      tenant,
    })
  ).id
  rejected = (
    await seedRequest({
      author: tenant.users.rejected!,
      reviewer: tenant.users.tutor!,
      status: 'in_review',
      tenant,
    })
  ).id
  await seedRequest({ author: tenant.users.done!, reviewer: tenant.users.tutor!, status: 'approved', tenant })
  tutor = await actAs(browser, tenant.users.tutor!)
})

test.afterAll(async () => {
  await tutor?.close()
  if (tenant) await removeTenant(tenant)
})

test('queue lists the assigned requests with their waiting time and flags the overdue one', async () => {
  const { page } = tutor
  await page.goto('/certificates')
  await expect(page.getByRole('tab', { name: /Assigned to me/u })).toBeVisible()
  const staleRow = page.getByRole('row').filter({ hasText: tenantNames(tenant, 'stale') })
  await expect(staleRow).toBeVisible()
  await expect(staleRow.getByText('9 days')).toBeVisible()
  const freshRow = page.getByRole('row').filter({ hasText: tenantNames(tenant, 'rejected') })
  await expect(freshRow.getByText('In review', { exact: true })).toBeVisible()
  await expect(freshRow.getByText('Today')).toBeVisible()

  await page.getByRole('combobox', { name: 'Waiting time' }).click()
  await page.getByRole('option', { name: 'Overdue only' }).click()
  await expect(staleRow).toBeVisible()
  await expect(freshRow).toBeHidden()
  expect(stale).toBeGreaterThan(0)
})

test('tutor claims a request from the unassigned tab', async () => {
  const { page } = tutor
  await page.goto('/certificates')
  await page.getByRole('tab', { name: /Unassigned/u }).click()
  const row = page.getByRole('row').filter({ hasText: tenantNames(tenant, 'pooled') })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Claim review' }).click()
  await expect(page.getByText('Certificate claimed. It is now in your assigned list.')).toBeVisible()
  await expect.poll(async () => (await certificateRow(pooled))?.reviewer_id).toBe(tenant.users.tutor!.id)
  await page.getByRole('tab', { name: /Assigned to me/u }).click()
  await expect(page.getByRole('row').filter({ hasText: tenantNames(tenant, 'pooled') })).toBeVisible()
})

test('tutor rejects a request with a reason and the volunteer sees it', async ({ browser }) => {
  const { page } = tutor
  await page.goto(`/certificates/${rejected}/review`)
  await page.getByRole('button', { name: 'Reject', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Reject this certificate?' })
  const confirm = dialog.getByRole('button', { name: 'Reject' })
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel('Reason').fill('too short')
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel('Reason').fill('The activity cannot be verified with the organization.')
  await confirm.click()
  await expect(page.getByText('Certificate rejected.')).toBeVisible()
  await expect.poll(async () => (await certificateRow(rejected))?.status).toBe('rejected')

  const volunteer = await actAs(browser, tenant.users.rejected!)
  await volunteer.page.goto(`/certificates/${rejected}`)
  await expect(volunteer.page.getByText('This request was rejected.')).toBeVisible()
  await expect(volunteer.page.getByText('The activity cannot be verified with the organization.').first()).toBeVisible()
  await expect(volunteer.page.getByRole('button', { name: 'Withdraw' })).toBeHidden()
  await volunteer.close()

  await page.goto('/certificates')
  await page.getByRole('tab', { name: /Completed/u }).click()
  await expect(page.getByRole('row').filter({ hasText: tenantNames(tenant, 'rejected') })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: tenantNames(tenant, 'done') })).toBeVisible()
})
