import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { login, openSidebar } from './helpers'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('logout', () => {
  test('signs out without an error toast', async ({ isMobile, page }) => {
    await login(page, 'volunteer')

    await page.evaluate(() => {
      const seen: string[] = []
      Object.assign(window, { logoutToasts: seen })
      new MutationObserver(() => {
        const text = document.body.innerText
        if (text.includes('Could not log out')) seen.push('Could not log out')
      }).observe(document.body, { characterData: true, childList: true, subtree: true })
    })

    await openSidebar(page, isMobile)
    await page
      .locator('[data-sidebar="menu-button"]')
      .filter({ hasText: seedEmail('volunteer') })
      .click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Log out' }).click()

    await expect(page).toHaveURL(/\/login\?loggedOut=true$/u)
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(page.getByText('Could not log out')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { logoutToasts: string[] }).logoutToasts)).toEqual([])

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/u)
    await expect(page.locator('input[name="username"]')).toBeVisible()
  })
})
