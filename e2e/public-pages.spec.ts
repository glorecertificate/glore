import { expect, test } from '@playwright/test'

import { SEED_PASSWORD } from '~/scripts/seed-data'

import { hydrated } from './helpers'

test.describe('anonymous visitor', () => {
  test('signs in with the username instead of the email', async ({ page }) => {
    await page.goto('/login')
    const username = page.locator('input[name="username"]')
    await hydrated(username)
    await username.fill('seed.learner')
    await page.locator('input[name="password"]').fill(SEED_PASSWORD)
    await page.locator('form button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/u)
  })

  test('links the legal pages from the login screen', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: 'Privacy policy' })).toBeVisible()
    const terms = page.getByRole('link', { name: 'Terms of use' })
    await hydrated(terms)
    await terms.click()
    await expect(page).toHaveURL(/\/terms$/u)
    await expect(page.getByTestId('legal-title')).toBeVisible()
  })

  for (const path of ['/privacy', '/terms', '/quality-charter']) {
    test(`reads ${path} without an account`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.ok()).toBe(true)
      await expect(page).toHaveURL(new RegExp(`${path}$`, 'u'))
      await expect(page.getByTestId('legal-title')).toBeVisible()
      await expect(page.getByTestId('legal-body').locator('h2').first()).toBeVisible()
    })
  }

  test('switches the language of a legal page', async ({ page }) => {
    await page.goto('/privacy')
    const english = await page.getByTestId('legal-title').textContent()
    await page.getByRole('button', { name: 'IT' }).click()
    await expect(page.getByTestId('legal-title')).not.toHaveText(english ?? '')
    await expect(page.getByRole('button', { name: 'IT' })).toHaveAttribute('aria-pressed', 'true')
  })
})
