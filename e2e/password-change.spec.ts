import { type Page, expect, test } from '@playwright/test'

import { SEED_PASSWORD } from '~/scripts/seed-data'

import { hydrated, login } from './helpers'

const changePassword = async (page: Page, current: string, next: string) => {
  const currentField = page.locator('input[autocomplete="current-password"]').first()
  await hydrated(currentField)
  await currentField.fill(current)
  const fields = page.locator('input[autocomplete="new-password"]')
  await fields.nth(0).fill(next)
  await fields.nth(1).fill(next)
  await page.getByRole('button', { name: /update password/iu }).click()
  await expect(page.getByText(/password (has been |was )?(changed|updated)/iu).first()).toBeVisible()
}

test('changing the password keeps the user on the security settings', async ({ page }) => {
  test.setTimeout(90_000)
  let navigations = 0
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) navigations += 1
  })

  await login(page, 'recovery')
  await page.goto('/settings?tab=security')
  const next = `Changed-${Date.now()}-Aa1!`

  navigations = 0
  await changePassword(page, SEED_PASSWORD, next)

  await expect(page).toHaveURL(/\/settings\?tab=security/u)
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  expect(navigations).toBeLessThan(5)

  await page.reload()
  await expect(page).toHaveURL(/\/settings\?tab=security/u)
  await changePassword(page, next, SEED_PASSWORD)
})
