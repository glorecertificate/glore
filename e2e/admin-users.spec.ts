import { type Page, expect, test } from '@playwright/test'

import { createLoginUser, listSubjectEvents, removeLoginUsers } from './db'
import { authFile, login } from './helpers'

const created: string[] = []

const provision = async (label: string) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const user = await createLoginUser({ email: `${label}-${stamp}@admin-e2e.glore.test`, firstName: `${label}${stamp}` })
  created.push(user.id)
  return user
}

const findRow = async (page: Page, email: string) => {
  await page.goto('/admin/users')
  await page.getByPlaceholder('Search by name, email, or username').fill(email)
  const row = page.getByRole('row').filter({ hasText: email })
  await expect(row).toBeVisible()
  return row
}

test.afterAll(async () => {
  await removeLoginUsers(created)
})

test.describe('platform admin', () => {
  test.use({ storageState: authFile('admin') })

  test('bans with a required reason and an expiry, then lifts the ban', async ({ browser, page }) => {
    const target = await provision('ban')
    const row = await findRow(page, target.email)

    await row.getByRole('button', { name: /Actions/u }).click()
    await page.getByRole('menuitem', { name: 'Ban user' }).click()
    const dialog = page.getByRole('dialog')
    const confirm = dialog.getByRole('button', { name: 'Ban user' })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Reason').fill('too short')
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Reason').fill('Repeated spam reports from several organizations')
    await dialog.getByLabel('7 days').click()
    await expect(confirm).toBeEnabled()
    await confirm.click()
    await expect(page.getByText(/is banned\./u)).toBeVisible()
    await expect(row.getByText('Banned', { exact: true })).toBeVisible()
    await expect(row.getByText(/Until /u)).toBeVisible()

    const guest = await browser.newPage({
      baseURL: test.info().project.use.baseURL,
      ignoreHTTPSErrors: true,
      storageState: { cookies: [], origins: [] },
    })
    await guest.goto('/login')
    await guest.locator('input[name="username"]').fill(target.email)
    await guest.locator('input[name="password"]').fill('Password1!')
    await guest.locator('form button[type="submit"]').click()
    await expect(guest).toHaveURL(/\/login/u)
    await guest.close()

    const events = await listSubjectEvents('account.suspended', target.id)
    expect(events).toHaveLength(1)
    expect(events[0]?.metadata).toMatchObject({ reason: 'Repeated spam reports from several organizations' })

    await row.getByRole('button', { name: /Actions/u }).click()
    await page.getByRole('menuitem', { name: 'Unban user' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Unban user' }).click()
    await expect(page.getByText(/can sign in again\./u)).toBeVisible()
    await expect(row.getByText('Active', { exact: true })).toBeVisible()

    const returning = await browser.newPage({
      baseURL: test.info().project.use.baseURL,
      ignoreHTTPSErrors: true,
      storageState: { cookies: [], origins: [] },
    })
    await login(returning, target.email.split('@')[0] ?? '')
    await returning.close()
  })

  test('views the platform as a user with a visible banner and returns to the admin session', async ({ page }) => {
    const target = await provision('view')
    const row = await findRow(page, target.email)
    const reason = 'Reproducing a support request about certificates'

    await row.getByRole('button', { name: /Actions/u }).click()
    await page.getByRole('menuitem', { name: 'View as user' }).click()
    const dialog = page.getByRole('dialog')
    const confirm = dialog.getByRole('button', { name: 'Start viewing' })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Reason').fill(reason)
    await confirm.click()

    await expect(page).toHaveURL(/\/dashboard/u)
    const banner = page.getByRole('region', { name: 'Viewing session' })
    await expect(banner).toContainText('You are viewing as')
    await expect(banner).toContainText(reason)
    await expect(banner).toContainText(/\d+:\d{2} left/u)

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeHidden()
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: 'Stop viewing' }).click()
    await expect(page).toHaveURL(/\/admin\/users/u)
    await expect(page.getByRole('region', { name: 'Viewing session' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

    const started = await listSubjectEvents('impersonation.started', target.id)
    const stopped = await listSubjectEvents('impersonation.stopped', target.id)
    expect(started).toHaveLength(1)
    expect(stopped).toHaveLength(1)
    expect(started[0]?.metadata).toMatchObject({ reason })
    expect(stopped[0]?.metadata).toMatchObject({ reason })
  })

  test('offers no ban or view-as for platform admins, and no actions on the own row', async ({ page }) => {
    const target = await provision('promote')
    const row = await findRow(page, target.email)

    await row.getByRole('button', { name: /Actions/u }).click()
    await expect(page.getByRole('menuitem', { name: 'View as user' })).toBeVisible()
    await page.getByRole('menuitem', { name: 'Make Admin' }).click()
    await expect(page.getByText(/is now Admin\./u)).toBeVisible()

    await row.getByRole('button', { name: /Actions/u }).click()
    await expect(page.getByRole('menuitem', { name: 'Make User' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'View as user' })).toBeHidden()
    await expect(page.getByRole('menuitem', { name: 'Ban user' })).toBeHidden()
    await page.keyboard.press('Escape')

    await page.getByPlaceholder('Search by name, email, or username').fill('admin@seed.glore.test')
    const own = page.getByRole('row').filter({ hasText: 'admin@seed.glore.test' })
    await expect(own).toBeVisible()
    await expect(own.getByRole('button', { name: /Actions/u })).toBeHidden()
  })
})

test.describe('volunteer', () => {
  test.use({ storageState: authFile('volunteer') })

  test('cannot open the admin users page', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeHidden()
  })
})
