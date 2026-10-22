import { type Locator, type Page, expect } from '@playwright/test'

import { SEED_PASSWORD, seedEmail } from '~/scripts/seed-data'

export const AUTH_ROLES = ['admin', 'editor', 'learner', 'owner', 'representative', 'tutor', 'volunteer'] as const

export type AuthRole = (typeof AUTH_ROLES)[number]

export const authFile = (role: AuthRole) => `.playwright/.auth/${role}.json`

export const loginWithEmail = async (page: Page, email: string) => {
  await page.goto('/login')
  await page.locator('input[name="username"]').fill(email)
  await page.locator('input[name="password"]').fill(SEED_PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/u)
}

export const login = async (page: Page, key: string) => await loginWithEmail(page, seedEmail(key))

export const hydrated = async (locator: Locator) => {
  await expect
    .poll(() => locator.evaluate(element => Object.keys(element).some(key => key.startsWith('__reactProps'))))
    .toBe(true)
}
