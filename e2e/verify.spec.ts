import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { clearRateLimits, removePublicCertificates, seedPublicCertificate, setPublicProfile } from './db'

const VALID = 'E2E0-VA11-D000'
const REVOKED = 'E2E0-REV0-KED0'
const UNKNOWN = 'E2E0-N0NE-X1ST'
const VOLUNTEER = seedEmail('volunteer')
const USERNAME = 'e2e.public.volunteer'

test.describe.configure({ mode: 'serial' })

test.describe('certificate verification', () => {
  test.beforeAll(async () => {
    await clearRateLimits()
    await seedPublicCertificate({ code: VALID, email: VOLUNTEER, status: 'approved' })
    await seedPublicCertificate({ code: REVOKED, email: VOLUNTEER, status: 'revoked' })
    await setPublicProfile({ email: VOLUNTEER, publicProfile: false, username: USERNAME })
  })

  test.afterAll(async () => {
    await removePublicCertificates([VALID, REVOKED])
    await setPublicProfile({ email: VOLUNTEER, publicProfile: false, username: null })
    await clearRateLimits()
  })

  test('shows a valid certificate to an anonymous visitor', async ({ page }) => {
    const response = await page.goto(`/verify/${VALID}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByText('Valid certificate')).toBeVisible()
    await expect(page.getByText(VALID)).toBeVisible()
    await expect(page.getByText('E2E statement').first()).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)
    await expect.poll(() => page.locator('#verification-json-ld').textContent()).toContain(VALID)
  })

  test('accepts a code typed in lower case without dashes', async ({ page }) => {
    await page.goto('/verify')
    await page.getByLabel('Certificate code').fill(VALID.replaceAll('-', '').toLowerCase())
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page).toHaveURL(new RegExp(`/verify/${VALID}$`, 'u'))
    await expect(page.getByText('Valid certificate')).toBeVisible()
  })

  test('marks a revoked certificate as no longer valid', async ({ page }) => {
    await page.goto(`/verify/${REVOKED}`)
    await expect(page.getByText('Revoked certificate')).toBeVisible()
    await expect(page.getByText(/no longer valid/u)).toBeVisible()
    await expect(page.getByText('E2E revoked')).toBeHidden()
  })

  test('says so for an unknown code', async ({ page }) => {
    await page.goto(`/verify/${UNKNOWN}`)
    await expect(page.getByRole('heading', { name: 'Certificate not found' })).toBeVisible()
  })

  test('rejects a malformed code on the lookup page', async ({ page }) => {
    await page.goto('/verify?code=not-a-code')
    await expect(page.getByText(/not a valid code/u)).toBeVisible()
  })

  test('hides a private profile and redirects legacy links to the verify page', async ({ page }) => {
    await page.goto(`/${USERNAME}`)
    await expect(page.getByText('This profile does not exist or is not public.')).toBeVisible()
    await expect(page.getByText('Verified certificate')).toBeHidden()

    await page.goto(`/${USERNAME}?v=e2e-${VALID.toLowerCase()}`)
    await expect(page).toHaveURL(new RegExp(`/verify/${VALID}$`, 'u'))
    await expect(page.getByText('Valid certificate')).toBeVisible()
  })

  test('serves the profile once the holder opts in', async ({ page }) => {
    await setPublicProfile({ email: VOLUNTEER, publicProfile: true, username: USERNAME })
    const response = await page.goto(`/${USERNAME}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByText('Verified certificate')).toBeVisible()
  })
})
