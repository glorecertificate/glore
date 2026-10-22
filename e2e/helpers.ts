import { type Page, expect } from '@playwright/test'

import { SEED_PASSWORD, seedEmail } from '~/scripts/seed-data'

export const AUTH_ROLES = ['admin', 'owner', 'tutor', 'volunteer'] as const

export type AuthRole = (typeof AUTH_ROLES)[number]

export const authFile = (role: AuthRole) => `.playwright/.auth/${role}.json`

export const login = async (page: Page, key: string) => {
  await page.goto('/login')
  await page.locator('input[name="username"]').fill(seedEmail(key))
  await page.locator('input[name="password"]').fill(SEED_PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/u)
}
