import { expect, test } from '@playwright/test'

import { SEED_PASSWORD } from '~/scripts/seed-data'

import { type Actor, actAs, openDialog } from './actors'
import { clearRateLimits } from './db'
import { clearMail, isMailpitUp, latestMailText, mailLinkPath } from './mail'
import { type Tenant, createTenant, removeTenant } from './tenant'
import { invitationRow, invitationToken, membershipRoleOf, seedInvitation } from './tenant-db'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let tenant: Tenant
let owner: Actor
let representative: Actor
let invitee = ''
let secondInvitee = ''
let thirdInvitee = ''
let linkUrl = ''

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('invite', [
    { key: 'owner', role: 'admin' },
    { key: 'representative', role: 'representative' },
    { key: 'acceptor', role: null },
    { key: 'loginacceptor', role: null },
    { key: 'decliner', role: null },
    { key: 'joiner', role: null },
  ])
  owner = await actAs(browser, tenant.users.owner!)
  representative = await actAs(browser, tenant.users.representative!)
  invitee = `single-${tenant.tag}@g2-invites.glore.test`
  secondInvitee = `bulk-a-${tenant.tag}@g2-invites.glore.test`
  thirdInvitee = `bulk-b-${tenant.tag}@g2-invites.glore.test`
})

test.afterAll(async () => {
  await owner?.close()
  await representative?.close()
  if (tenant) await removeTenant(tenant)
})

test('owner sends a single invitation that reaches the inbox and shows as pending', async ({ request }) => {
  const mail = await isMailpitUp(request)
  if (mail) await clearMail(request, invitee)
  const { page } = owner
  await page.goto('/organization?tab=invitations')
  const dialog = page.getByRole('dialog', { name: 'Invite people' })
  await openDialog(page.getByRole('button', { name: 'Invite people' }), dialog)
  await dialog.getByLabel('Email address').fill(invitee)
  await dialog.getByRole('button', { name: 'Send invitation' }).click()
  await expect(page.getByText(`Invitation sent to ${invitee}`)).toBeVisible()

  const row = page.getByRole('row').filter({ hasText: invitee })
  await expect(row.getByText('Pending', { exact: true })).toBeVisible()
  expect(await invitationToken(tenant, invitee)).not.toBe('')
  if (!mail) return
  expect(mailLinkPath(await latestMailText(request, invitee), '/invite/')).toContain('/invite/')
})

test('owner pastes several addresses and reads the result of each row', async () => {
  const { page } = owner
  await page.goto('/organization?tab=invitations')
  const dialog = page.getByRole('dialog', { name: 'Invite people' })
  await openDialog(page.getByRole('button', { name: 'Invite people' }), dialog)
  await dialog.getByRole('radio', { name: 'Several people' }).click()
  await dialog.getByLabel('Email addresses').fill(`${secondInvitee}, ${thirdInvitee}\n${invitee}`)
  await expect(dialog.getByText('3 addresses ready')).toBeVisible()
  await dialog.getByRole('button', { name: 'Send 3 invitations' }).click()
  await expect(dialog.getByText('2 of 3 invitations sent')).toBeVisible()
  await expect(dialog.getByText('Already invited')).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row').filter({ hasText: secondInvitee })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: thirdInvitee })).toBeVisible()
})

test('owner resends and revokes an invitation, and the revoked link stops working', async ({ browser }) => {
  const { page } = owner
  await page.goto('/organization?tab=invitations')
  const token = await invitationToken(tenant, thirdInvitee)
  const row = page.getByRole('row').filter({ hasText: thirdInvitee })

  await openDialog(
    row.getByRole('button', { name: 'Resend' }),
    page.getByText(/Invitation sent again to|Wait a minute before sending/u)
  )

  const revokeDialog = page.getByRole('alertdialog')
  await openDialog(row.getByRole('button', { name: 'Revoke' }), revokeDialog)
  await revokeDialog.getByRole('button', { name: 'Revoke' }).click()
  await expect(page.getByText(`Invitation to ${thirdInvitee} revoked`)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: thirdInvitee })).toHaveCount(0)
  expect((await invitationRow(tenant, thirdInvitee))?.revoked_at).not.toBeNull()

  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const guestPage = await guest.newPage()
  await guestPage.goto(`/invite/${token}`)
  await expect(guestPage.getByRole('heading', { name: 'This link is no longer active' })).toBeVisible()
  await guest.close()
})

test('expired, revoked, and unknown invitation links explain themselves', async ({ browser }) => {
  const expired = await seedInvitation({
    email: `expired-${tenant.tag}@g2-invites.glore.test`,
    role: 'volunteer',
    state: 'expired',
    tenant,
  })
  const revoked = await seedInvitation({
    email: `revoked-${tenant.tag}@g2-invites.glore.test`,
    role: 'volunteer',
    state: 'revoked',
    tenant,
  })
  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const page = await guest.newPage()

  await page.goto(`/invite/${expired}`)
  await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible()
  await page.goto(`/invite/${revoked}`)
  await expect(page.getByRole('heading', { name: 'This link is no longer active' })).toBeVisible()
  await page.goto('/invite/not-a-real-token')
  await expect(page.getByRole('heading', { name: 'Invitation not found' })).toBeVisible()
  await guest.close()
})

test('an existing account accepts an invitation while logged in', async ({ browser }) => {
  const user = tenant.users.acceptor!
  const token = await seedInvitation({ email: user.email, role: 'volunteer', state: 'pending', tenant })
  const actor = await actAs(browser, user)
  await actor.page.goto(`/invite/${token}`)
  await expect(actor.page.getByRole('heading', { name: `Join ${tenant.name}` })).toBeVisible()
  await actor.page.getByRole('button', { name: 'Accept invitation' }).click()
  await expect(actor.page).toHaveURL(/\/dashboard/u)
  await expect.poll(() => membershipRoleOf(tenant, user.id)).toBe('volunteer')
  await actor.close()
})

test('an existing account accepts an invitation by logging in from the link', async ({ browser }) => {
  const user = tenant.users.loginacceptor!
  const token = await seedInvitation({ email: user.email, role: 'learner', state: 'pending', tenant })
  await clearRateLimits()
  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const page = await guest.newPage()
  await page.goto(`/invite/${token}`)
  await page.getByLabel('Password').fill(SEED_PASSWORD)
  await page.getByRole('button', { name: 'Log in and continue' }).click()
  await expect(page.getByRole('heading', { name: `Join ${tenant.name}` })).toBeVisible()
  await page.getByRole('button', { name: 'Accept invitation' }).click()
  await expect(page).toHaveURL(/\/dashboard/u)
  await expect.poll(() => membershipRoleOf(tenant, user.id)).toBe('learner')
  await guest.close()
})

test('an invitee declines and the organization keeps no membership', async ({ browser }) => {
  const user = tenant.users.decliner!
  const token = await seedInvitation({ email: user.email, role: 'volunteer', state: 'pending', tenant })
  const actor = await actAs(browser, user)
  await actor.page.goto(`/invite/${token}`)
  await actor.page.getByRole('button', { name: 'Decline' }).click()
  await actor.page.getByRole('alertdialog').getByRole('button', { name: 'Decline' }).click()
  await expect(actor.page.getByText('Invitation declined').first()).toBeVisible()
  expect(await membershipRoleOf(tenant, user.id)).toBeNull()
  expect((await invitationRow(tenant, user.email))?.declined_at).not.toBeNull()

  await actor.page.goto(`/invite/${token}`)
  await expect(actor.page.getByRole('heading', { name: 'Invitation declined' })).toBeVisible()
  await actor.close()
})

test('representative sees only the roles they may invite', async () => {
  const { page } = representative
  await page.goto('/organization?tab=invitations')
  const dialog = page.getByRole('dialog', { name: 'Invite people' })
  await openDialog(page.getByRole('button', { name: 'Invite people' }), dialog)
  await dialog.getByRole('combobox', { name: 'Role' }).click()
  await expect(page.getByRole('option', { name: 'Volunteer' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Tutor' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Representative' })).toBeHidden()
  await page.keyboard.press('Escape')
})

test('an invite link with approval turns into a join request the representative approves', async ({ browser }) => {
  const { page } = owner
  await page.goto('/organization?tab=invitations')
  const dialog = page.getByRole('dialog', { name: 'Create invite link' })
  await openDialog(page.getByRole('button', { name: 'Create link' }), dialog)
  await expect(dialog.getByRole('switch', { name: 'Require approval' })).toBeChecked()
  await dialog.getByRole('button', { name: 'Create link' }).click()
  await expect(dialog.getByText('Link created.')).toBeVisible()
  linkUrl = await dialog.getByRole('textbox', { name: 'Invite link' }).inputValue()
  expect(linkUrl).toContain('/join/')
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Needs approval').first()).toBeVisible()

  const user = tenant.users.joiner!
  const joiner = await actAs(browser, user)
  await joiner.page.goto(new URL(linkUrl).pathname)
  await joiner.page.getByRole('button', { name: 'Request access' }).click()
  await expect(joiner.page.getByRole('heading', { name: 'Request sent' })).toBeVisible()
  expect(await membershipRoleOf(tenant, user.id)).toBeNull()
  await joiner.close()

  const reps = representative.page
  await reps.goto('/organization?tab=requests')
  await expect(reps.getByText(user.email)).toBeVisible()
  await openDialog(reps.getByRole('button', { name: 'Approve' }).first(), reps.getByText('Join request approved'))
  await expect.poll(() => membershipRoleOf(tenant, user.id)).not.toBeNull()
})

test('owner revokes the invite link and it stops working', async ({ browser }) => {
  const { page } = owner
  await page.goto('/organization?tab=invitations')
  const confirmation = page.getByRole('alertdialog')
  await openDialog(page.getByRole('button', { name: 'Revoke' }).last(), confirmation)
  await confirmation.getByRole('button', { name: 'Revoke' }).click()
  await expect(page.getByText('Invite link revoked')).toBeVisible()

  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const guestPage = await guest.newPage()
  await guestPage.goto(new URL(linkUrl).pathname)
  await expect(guestPage.getByRole('heading', { name: 'This link is no longer active' })).toBeVisible()
  await guest.close()
})
