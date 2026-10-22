import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { removePublicCertificates, seedPublicCertificate } from './db'
import { authFile } from './helpers'

const CODE = 'E2E1-ADM0-C3R7'
const CODE_QUERY = CODE.replaceAll('-', '').toLowerCase()
const VOLUNTEER = seedEmail('volunteer')

test.describe.configure({ mode: 'serial' })

test.describe('admin certificate lookup', () => {
  test.use({ storageState: authFile('admin') })

  test.beforeAll(async () => {
    await seedPublicCertificate({ code: CODE, email: VOLUNTEER, status: 'approved' })
  })

  test.afterAll(async () => {
    await removePublicCertificates([CODE])
  })

  test('finds a certificate by its code typed in lower case without dashes', async ({ page }) => {
    await page.goto('/admin/certificates')
    await page.getByPlaceholder('Search by code, holder or organization').fill(CODE_QUERY)
    const row = page.getByRole('row').filter({ hasText: CODE })
    await expect(row).toBeVisible()
    await expect(row.getByText(VOLUNTEER)).toBeVisible()
    await expect(row.getByText('Approved', { exact: true })).toBeVisible()
  })

  test('opens the certificate detail from the row', async ({ page }) => {
    await page.goto(`/admin/certificates?q=${CODE_QUERY}`)
    const row = page.getByRole('row').filter({ hasText: CODE })
    await row.getByRole('link', { name: 'View' }).click()
    await expect(page).toHaveURL(/\/certificates\/\d+$/u)
    await expect(page.getByText(CODE).first()).toBeVisible()
  })

  test('shows the organization pipeline when an organization is picked', async ({ page }) => {
    await page.goto(`/admin/certificates?q=${CODE_QUERY}`)
    const row = page.getByRole('row').filter({ hasText: CODE })
    await row
      .getByRole('link', { name: /Org|Association|Volunteer/u })
      .first()
      .click()
    await expect(page).toHaveURL(/org=\d+/u)
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: CODE })).toBeVisible()
  })

  test('revokes an approved certificate with a required reason', async ({ page }) => {
    await page.goto(`/admin/certificates?q=${CODE_QUERY}`)
    const row = page.getByRole('row').filter({ hasText: CODE })
    await row.getByRole('button', { name: 'Revoke' }).click()
    const dialog = page.getByRole('dialog')
    const confirm = dialog.getByRole('button', { name: 'Revoke certificate' })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Reason').fill('Issued by mistake during the end to end run')
    await confirm.click()
    await expect(page.getByText('Certificate revoked.')).toBeVisible()
    await expect(row.getByText('Revoked', { exact: true })).toBeVisible()
  })
})
