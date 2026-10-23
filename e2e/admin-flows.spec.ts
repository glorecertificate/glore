import { expect, test } from '@playwright/test'

import { openDialog } from './actors'
import { deleteUserByEmail } from './db'
import { authFile } from './helpers'
import { withDb } from './tenant'

test.use({ storageState: authFile('admin') })
test.describe.configure({ timeout: 90_000 })

const created = { emails: [] as string[], names: [] as string[], organizations: [] as number[] }

const stamp = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const seedDetail = async (label: string) => {
  const tag = stamp()
  const name = `G2 ${label} ${tag}`
  const email = `applicant-${tag}@g2-apps.glore.test`
  const id = await withDb(async pool => {
    const organization = await pool.query<{ id: number }>(
      "insert into organizations (handle, name, email, city) values ($1, $2, $3, 'Valencia') returning id",
      [`g2-app-${tag}`, name, `info-${tag}@g2-apps.glore.test`]
    )
    const organizationId = organization.rows[0]!.id
    await pool.query(
      `insert into organization_profiles
        (organization_id, country, legal_name, registry_id, contact_name, contact_email, volunteers_per_year, motivation, charter_accepted_at)
       values ($1, 'ES', $2, $3, 'Lucia Alvarez', $4, 30, 'We certify the skills of our volunteers.', now())`,
      [organizationId, `${name} SL`, `ES-${tag}`, email]
    )
    await pool.query(
      `insert into organization_join_requests (organization_id, email, first_name, last_name, role, locale, status)
       values ($1, $2, 'Lucia', 'Alvarez', 'admin', 'en', 'pending')`,
      [organizationId, email]
    )
    return organizationId
  })
  created.organizations.push(id)
  created.emails.push(email)
  return { email, id, name }
}

test.afterAll(async () => {
  await withDb(async pool => {
    await pool.query('delete from activity_events where organization_id = any($1)', [created.organizations])
    await pool.query('delete from organizations where id = any($1)', [created.organizations])
    await pool.query('delete from organizations where name = any($1)', [created.names])
    await pool.query('delete from team_invitations where lower(email) = any($1)', [
      created.emails.map(item => item.toLowerCase()),
    ])
  })
  for (const email of created.emails) await deleteUserByEmail(email)
})

test('shows the overview with real numbers and working shortcuts', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByText('Certificate pipeline')).toBeVisible()
  await expect(page.getByText('Review time')).toBeVisible()
  await expect(page.getByText('Something went wrong')).toBeHidden()
  await expect(page.getByText('The overview could not be loaded.')).toBeHidden()
  const users = page.getByText('Users', { exact: true }).first()
  await expect(users).toBeVisible()
  await expect(page.getByText(/\d+ active, \d+ pending, \d+ rejected/u)).toBeVisible()

  await page
    .getByRole('link', { name: /Audit log/u })
    .first()
    .click()
  await expect(page).toHaveURL(/\/admin\/audit/u)
})

test('rejects an application with a comment and lists it as rejected', async ({ browser, page }) => {
  const tag = stamp()
  const name = `G2 Reject ${tag}`
  created.names.push(name)
  created.emails.push(`applicant-${tag}@g2-apps.glore.test`)
  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const form = await guest.newPage()
  await form.goto('/register')
  await form.getByLabel('Organization name', { exact: true }).fill(name)
  await form.getByLabel('Legal name', { exact: true }).fill(`${name} APS`)
  await form.getByLabel('Registry ID', { exact: true }).fill(`IT-${tag}`)
  await form.getByRole('combobox').click()
  await form.getByRole('option', { name: /Italy/u }).click()
  await form.getByLabel('City', { exact: true }).fill('Milan')
  await form.getByLabel('Organization email', { exact: true }).fill(`info-${tag}@g2-apps.glore.test`)
  await form.getByLabel('Volunteers per year', { exact: true }).fill('40')
  await form.getByRole('button', { name: 'Continue' }).click()
  await form.getByLabel('First name', { exact: true }).fill('Maria')
  await form.getByLabel('Last name', { exact: true }).fill('Rossi')
  await form.getByLabel('Your email address', { exact: true }).fill(`applicant-${tag}@g2-apps.glore.test`)
  await form.getByRole('button', { name: 'Continue' }).click()
  await form.getByLabel('Motivation', { exact: true }).fill('We certify the skills of our volunteers.')
  await form.getByRole('button', { name: 'Continue' }).click()
  await form.getByRole('checkbox', { name: 'I accept the Quality Charter' }).check()
  await form.getByRole('button', { name: 'Send application' }).click()
  await expect(form.getByRole('heading', { name: 'Application received' })).toBeVisible()
  await guest.close()

  await page.goto('/admin/organizations')
  const row = page.getByRole('link', { name }).locator('..')
  await expect(async () => {
    await page.reload()
    await expect(row).toBeVisible({ timeout: 2000 })
  }).toPass()
  await row.getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('menuitem', { name: 'View application' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText(`${name} APS`)).toBeVisible()
  await expect(sheet.getByText('Maria Rossi')).toBeVisible()
  await sheet.getByRole('button', { name: 'Reject' }).click()
  const confirmation = page.getByRole('alertdialog')
  await confirmation
    .getByPlaceholder('Please explain why the registration was not approved…')
    .fill('Incomplete registry data')
  await confirmation.getByRole('button', { name: 'Reject' }).click()
  await expect(page.getByText(`${name} has been rejected.`)).toBeVisible()

  await page.getByRole('tab', { name: 'Rejected' }).click()
  await expect(page.getByRole('link', { name })).toBeVisible()
})

test('opens the organization detail with the application, members, and invitations tabs', async ({ page }) => {
  const application = await seedDetail('detail')
  await page.goto(`/admin/organizations/${application.id}`)
  await expect(page).toHaveTitle(new RegExp(application.name, 'u'))
  await expect(page.getByText(`${application.name} SL`)).toBeVisible()
  await expect(page.getByText('Lucia Alvarez').first()).toBeVisible()

  for (const tab of ['Members', 'Invitations', 'Certificates', 'Activity']) {
    await page.getByRole('tab', { name: new RegExp(tab, 'u') }).click()
    await expect(page.getByText('Something went wrong')).toBeHidden()
  }
})

test('invites a team member, resends the invitation, changes the role, and removes the member', async ({ page }) => {
  const email = `team-${stamp()}@g2-team.glore.test`
  created.emails.push(email)
  await page.goto('/admin/team')
  const dialog = page.getByRole('dialog', { name: 'Invite team member' })
  await openDialog(page.getByRole('button', { name: 'Invite member' }), dialog)
  await dialog.getByLabel('First name').fill('Nuria')
  await dialog.getByLabel('Last name').fill('Equipo')
  await dialog.getByLabel('Email address').fill(email)
  await dialog.getByRole('button', { name: 'Send invitation' }).click()
  await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible()

  const row = page.locator('div.group').filter({ hasText: email })
  await expect(row.getByText('Pending').first()).toBeVisible()
  const actions = row.getByRole('button', { name: 'Actions' })

  const resend = page.getByRole('menuitem', { name: 'Resend invitation' })
  await openDialog(actions, resend)
  await resend.click()
  await expect(
    page.getByText(new RegExp(`Invitation resent to ${email}!|Wait a minute before sending`, 'u'))
  ).toBeVisible()

  const promote = page.getByRole('menuitem', { name: /^Make /u })
  await openDialog(actions, promote)
  await promote.click()
  await expect(row.getByText('Admin', { exact: true })).toBeVisible()

  const remove = page.getByRole('menuitem', { name: 'Remove member' })
  await openDialog(actions, remove)
  await remove.click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove member' }).click()
  await expect(page.getByText('Team member removed successfully.')).toBeVisible()
})

test('keeps the Organization item out of the admin sidebar', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('link', { name: 'Organization', exact: true })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Users', exact: true }).first()).toBeVisible()
})
