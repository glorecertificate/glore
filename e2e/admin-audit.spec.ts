import { expect, test } from '@playwright/test'

import { createLoginUser, removeLoginUsers } from './db'
import { authFile } from './helpers'

const created: string[] = []

test.afterAll(async () => {
  await removeLoginUsers(created)
})

test.describe('platform admin', () => {
  test.use({ storageState: authFile('admin') })

  test('shows a ban in the audit log with its reason, and filters by category and date', async ({ page }) => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    const target = await createLoginUser({ email: `audit-${stamp}@admin-e2e.glore.test`, firstName: `Audit${stamp}` })
    created.push(target.id)
    const reason = 'Repeated spam reports found by the audit run'

    await page.goto('/admin/users')
    await page.getByPlaceholder('Search by name, email, or username').fill(target.email)
    const userRow = page.getByRole('row').filter({ hasText: target.email })
    await userRow.getByRole('button', { name: /Actions/u }).click()
    await page.getByRole('menuitem', { name: 'Ban user' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Reason').fill(reason)
    await dialog.getByRole('button', { name: 'Ban user' }).click()
    await expect(userRow.getByText('Banned', { exact: true })).toBeVisible()

    await page.goto('/admin/audit')
    await page.getByPlaceholder('Search by person or organization').fill(target.email)
    const row = page.getByRole('row').filter({ hasText: reason })
    await expect(row).toBeVisible()
    await expect(row).toContainText(/banned/u)
    await expect(row.getByRole('link', { name: `Audit${stamp}` })).toBeVisible()
    await expect(row.getByText('Moderation', { exact: true })).toBeVisible()

    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Impersonation' }).click()
    await expect(row.getByRole('link', { name: `Audit${stamp}` })).toBeHidden()

    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Moderation' }).click()
    await expect(row).toBeVisible()

    await page.getByLabel('From date').fill('2999-01-01')
    await expect(page.getByText('No events found')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText('No events found')).toBeHidden()
  })
})

test.describe('volunteer', () => {
  test.use({ storageState: authFile('volunteer') })

  test('cannot open the audit log', async ({ page }) => {
    await page.goto('/admin/audit')
    await expect(page.getByRole('heading', { name: 'Audit log' })).toBeHidden()
    await expect(page.getByPlaceholder('Search by person or organization')).toBeHidden()
  })
})
