import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { pruneSessions } from './db'
import { authFile, hydrated, login } from './helpers'

test.describe('settings', () => {
  test.use({ storageState: authFile('learner') })
  test.describe.configure({ mode: 'serial' })

  test('toggles the public profile and keeps it after a reload', async ({ page }) => {
    await page.goto('/settings?tab=privacy')
    const toggle = page.getByRole('switch', { name: 'Make my profile public' })
    await expect(toggle).not.toBeChecked()
    await hydrated(toggle)

    await toggle.click()
    await expect(page.getByText('Privacy settings saved')).toBeVisible()
    await expect(toggle).toBeChecked()
    await page.reload()
    await expect(toggle).toBeChecked()
    await hydrated(toggle)

    await toggle.click()
    await expect(page.getByText('Privacy settings saved')).toBeVisible()
    await expect(toggle).not.toBeChecked()
  })

  test('turns an email category off and on', async ({ page }) => {
    await page.goto('/settings?tab=notifications')
    const reminders = page.getByRole('switch', { name: 'Reminders' })
    await expect(reminders).toBeChecked()
    await hydrated(reminders)

    await reminders.click()
    await expect(page.getByText('Notification settings saved')).toBeVisible()
    await expect(reminders).not.toBeChecked()
    await page.reload()
    await expect(reminders).not.toBeChecked()
    await hydrated(reminders)

    await reminders.click()
    await expect(page.getByText('Notification settings saved')).toBeVisible()
    await expect(reminders).toBeChecked()
  })

  test('rejects a reserved username', async ({ page }) => {
    await page.goto('/settings?tab=account')
    const username = page.getByLabel('Username')
    await hydrated(username)
    await username.fill('terms')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('This username is reserved. Choose another one.')).toBeVisible()
  })

  test('downloads the personal data as JSON', async ({ page }) => {
    await page.goto('/settings?tab=data')
    const button = page.getByRole('button', { name: 'Download my data' })
    await hydrated(button)
    const download = page.waitForEvent('download')
    await button.click()

    const file = await (await download).path()
    const exported = JSON.parse(await readFile(file, 'utf8'))
    expect(exported.format).toBe('glore-account-export')
    expect(exported.account.email).toBe(seedEmail('learner'))
    expect(JSON.stringify(exported)).not.toMatch(/password/u)
  })

  test('lists the sessions and signs out another device', async ({ browser, page }) => {
    await pruneSessions(seedEmail('learner'), 3)
    const other = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const otherPage = await other.newPage()
    await login(otherPage, 'learner')

    await page.goto('/settings?tab=security')
    const rows = page.getByTestId('session-row')
    await expect(rows.filter({ hasText: 'This device' })).toHaveCount(1)
    const before = await rows.count()
    expect(before).toBeGreaterThanOrEqual(2)

    await rows.getByRole('button', { name: 'Log out' }).first().click()
    await expect(page.getByText('Session logged out')).toBeVisible()
    await expect(rows).toHaveCount(before - 1)

    await other.close()
  })

  test('shows the transfer prompt to the sole administrator', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('owner') })
    const page = await context.newPage()
    await page.goto('/settings?tab=data')
    await expect(page.getByTestId('delete-blocked')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete account' })).toBeDisabled()
    await context.close()
  })
})
