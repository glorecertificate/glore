import { expect, test } from '@playwright/test'

import { type Actor, actAs, openDialog, tenantNames } from './actors'
import { hydrated } from './helpers'
import { type Tenant, certificateRow, createTenant, removeTenant, seedRequest } from './tenant'
import { addMembership, certificateStatuses, membershipRoleOf, organizationExists } from './tenant-db'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let tenant: Tenant
let owner: Actor
let representative: Actor
let openRequest = 0
let approvedRequest = 0

const rowFor = (actor: Actor, name: string) => actor.page.getByRole('row').filter({ hasText: name })

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('roles', [
    { key: 'owner', role: 'admin' },
    { key: 'representative', role: 'representative' },
    { key: 'tutor', role: 'tutor' },
    { key: 'tutor2', role: 'tutor' },
    { completedSkills: 3, key: 'volunteer', role: 'volunteer' },
    { completedSkills: 3, key: 'holder', role: 'volunteer' },
    { key: 'removable', role: 'volunteer' },
    { key: 'learner', role: 'learner' },
  ])
  openRequest = (
    await seedRequest({
      author: tenant.users.volunteer!,
      reviewer: tenant.users.tutor!,
      status: 'submitted',
      tenant,
    })
  ).id
  approvedRequest = (await seedRequest({ author: tenant.users.holder!, status: 'approved', tenant })).id
  owner = await actAs(browser, tenant.users.owner!)
  representative = await actAs(browser, tenant.users.representative!)
})

test.afterAll(async () => {
  await owner?.close()
  await representative?.close()
  if (tenant) await removeTenant(tenant)
})

test('representative cannot change roles, open settings, transfer ownership, or delete the organization', async () => {
  const { page } = representative
  await page.goto('/organization?tab=members')
  const row = rowFor(representative, tenantNames(tenant, 'learner'))
  await expect(row).toBeVisible()
  await openDialog(
    row.getByRole('button', { name: /^Actions for /u }),
    page.getByRole('menuitem', { name: 'Remove member' })
  )
  await expect(page.getByRole('menuitem', { name: 'Change role' })).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Transfer ownership' })).toBeHidden()

  const ownerRow = rowFor(representative, tenantNames(tenant, 'owner'))
  await expect(ownerRow.getByRole('button', { name: /^Actions for /u })).toBeHidden()

  await expect(
    page.getByRole('tab', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' }))
  ).toBeHidden()
  await page.goto('/organization?tab=settings')
  await expect(page.getByRole('button', { name: 'Delete organization' })).toBeHidden()
  await expect(page.getByLabel('Legal representative')).toBeHidden()
})

test('representative removes a volunteer and reassigns a request to another tutor', async () => {
  const { page } = representative
  await page.goto('/organization?tab=members')
  const row = rowFor(representative, tenantNames(tenant, 'removable'))
  const item = page.getByRole('menuitem', { name: 'Remove member' })
  await openDialog(row.getByRole('button', { name: /^Actions for /u }), item)
  await item.click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove member' }).click()
  await expect(page.getByText('Member removed')).toBeVisible()
  expect(await membershipRoleOf(tenant, tenant.users.removable!.id)).toBeNull()

  await page.goto('/organization?tab=certificates')
  const request = rowFor(representative, tenantNames(tenant, 'volunteer'))
  await request.getByRole('combobox', { name: 'Reassign reviewer' }).click()
  await page.getByRole('option', { name: `${tenant.users.tutor2!.firstName} ${tenant.users.tutor2!.lastName}` }).click()
  await expect(page.getByText('Reviewer updated.')).toBeVisible()
  await expect.poll(async () => (await certificateRow(openRequest))?.reviewer_id).toBe(tenant.users.tutor2!.id)
  await page.reload()
  await expect(
    rowFor(representative, tenantNames(tenant, 'volunteer')).getByRole('combobox', { name: 'Reassign reviewer' })
  ).toContainText(tenant.users.tutor2!.firstName)
  await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible()
  expect(openRequest).toBeGreaterThan(0)
})

test('owner changes a role and changes it back', async () => {
  const { page } = owner
  await page.goto('/organization?tab=members')
  const row = rowFor(owner, tenantNames(tenant, 'tutor2'))
  const item = page.getByRole('menuitem', { name: 'Change role' })
  await openDialog(row.getByRole('button', { name: /^Actions for /u }), item)
  await item.click()
  const dialog = page.getByRole('dialog', { name: 'Change role' })
  await dialog.getByRole('combobox', { name: 'New role' }).click()
  await page.getByRole('option', { name: 'Volunteer' }).click()
  await dialog.getByRole('button', { name: 'Save role' }).click()
  await expect(page.getByText('Member role updated')).toBeVisible()
  await expect.poll(() => membershipRoleOf(tenant, tenant.users.tutor2!.id)).toBe('volunteer')

  await openDialog(row.getByRole('button', { name: /^Actions for /u }), item)
  await item.click()
  await dialog.getByRole('combobox', { name: 'New role' }).click()
  await page.getByRole('option', { name: 'Tutor' }).click()
  await dialog.getByRole('button', { name: 'Save role' }).click()
  await expect(page.getByText('Member role updated')).toBeVisible()
  await expect.poll(() => membershipRoleOf(tenant, tenant.users.tutor2!.id)).toBe('tutor')
})

test('owner sets the certificate signatory and the value survives a reload', async () => {
  const { page } = owner
  await page.goto('/organization?tab=settings')
  const field = page.getByLabel('Legal representative')
  await hydrated(field)
  await field.fill('Marta Firmataria')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Organization updated successfully')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Legal representative')).toHaveValue('Marta Firmataria')
})

test('owner revokes an approved certificate with a reason', async () => {
  const { page } = owner
  await page.goto('/organization?tab=certificates')
  const row = rowFor(owner, tenantNames(tenant, 'holder'))
  await expect(row.getByText('Approved', { exact: true })).toBeVisible()
  await row.getByRole('button', { name: 'Revoke' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revoke this certificate?' })
  const confirm = dialog.getByRole('button', { name: 'Revoke certificate' })
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel('Reason').fill('Issued by mistake during the end to end run')
  await confirm.click()
  await expect(page.getByText('Certificate revoked.')).toBeVisible()
  await expect.poll(() => certificateStatuses(tenant)).toContain('revoked')
  await page.reload()
  await expect(rowFor(owner, tenantNames(tenant, 'holder')).getByText('Revoked', { exact: true })).toBeVisible()
  expect(approvedRequest).toBeGreaterThan(0)
})

test('owner cannot delete an organization that has certificates', async () => {
  const { page } = owner
  await page.goto('/organization?tab=settings')
  const confirmation = page.getByRole('alertdialog')
  await openDialog(page.getByRole('button', { name: 'Delete organization' }), confirmation)
  await confirmation.getByRole('button', { name: 'Delete organization' }).click()
  await expect(page.getByText('This organization has certificates and cannot be deleted.')).toBeVisible()
  expect(await organizationExists(tenant.id)).toBe(true)
})

test('owner transfers ownership to a representative and the new owner transfers it back', async () => {
  const { page } = owner
  await page.goto('/organization?tab=members')
  const dialog = page.getByRole('dialog', { name: 'Transfer ownership' })
  await openDialog(page.getByRole('button', { name: 'Transfer ownership' }), dialog)
  const confirm = dialog.getByRole('button', { name: 'Transfer ownership' })
  await dialog.getByRole('combobox', { name: 'New owner' }).click()
  await page.getByRole('option', { name: tenant.users.representative!.firstName }).click()
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel(`Type ${tenant.name} to confirm`).fill(tenant.name)
  await confirm.click()
  await expect(page.getByText('Ownership transferred')).toBeVisible()
  await expect.poll(() => membershipRoleOf(tenant, tenant.users.representative!.id)).toBe('admin')
  expect(await membershipRoleOf(tenant, tenant.users.owner!.id)).toBe('representative')

  const next = representative.page
  await next.goto('/organization?tab=members')
  const back = next.getByRole('dialog', { name: 'Transfer ownership' })
  await openDialog(next.getByRole('button', { name: 'Transfer ownership' }).first(), back)
  await back.getByRole('combobox', { name: 'New owner' }).click()
  await next.getByRole('option', { name: tenant.users.owner!.firstName }).click()
  await back.getByLabel(`Type ${tenant.name} to confirm`).fill(tenant.name)
  await back.getByRole('button', { name: 'Transfer ownership' }).click()
  await expect(next.getByText('Ownership transferred')).toBeVisible()
  await expect.poll(() => membershipRoleOf(tenant, tenant.users.owner!.id)).toBe('admin')
  expect(await membershipRoleOf(tenant, tenant.users.representative!.id)).toBe('representative')
})

test('an owner deletes an organization without certificates', async ({ browser }) => {
  const empty = await createTenant('roles-empty', [{ key: 'owner', role: 'admin' }])
  const actor = await actAs(browser, empty.users.owner!)
  try {
    await actor.page.goto('/organization?tab=settings')
    const confirmation = actor.page.getByRole('alertdialog')
    await openDialog(actor.page.getByRole('button', { name: 'Delete organization' }), confirmation)
    await confirmation.getByRole('button', { name: 'Delete organization' }).click()
    await expect(actor.page.getByText('Organization deleted')).toBeVisible()
    expect(await organizationExists(empty.id)).toBe(false)
  } finally {
    await actor.close()
    await removeTenant(empty)
  }
})

test('a member of two organizations switches between them and leaves one', async ({ browser }) => {
  const second = await createTenant('roles-second', [{ key: 'owner', role: 'admin' }])
  await addMembership(second, tenant.users.volunteer!.id, 'tutor')
  const actor = await actAs(browser, tenant.users.volunteer!)
  try {
    const { page } = actor
    await page.goto('/dashboard')
    await page
      .getByRole('button', { name: new RegExp(tenant.name, 'u') })
      .first()
      .click()
    await expect(page.getByRole('menuitem', { name: new RegExp(second.name, 'u') })).toContainText('Tutor')
    await expect(page.getByRole('menuitem', { name: new RegExp(tenant.name, 'u') }).first()).toContainText('Volunteer')
    await page.getByRole('menuitem', { name: new RegExp(second.name, 'u') }).click()
    await expect(page.getByRole('button', { name: new RegExp(second.name, 'u') }).first()).toContainText('Tutor')
    await expect(page.getByText('Average review time')).toBeVisible()

    await page
      .getByRole('button', { name: new RegExp(second.name, 'u') })
      .first()
      .click()
    await page.getByRole('menuitem', { name: new RegExp(`Leave ${second.name}`, 'u') }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Leave organization' }).click()
    await expect(page.getByText('You left the organization')).toBeVisible()
    expect(await membershipRoleOf(second, tenant.users.volunteer!.id)).toBeNull()
  } finally {
    await actor.close()
    await removeTenant(second)
  }
})
