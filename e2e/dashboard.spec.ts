import { expect, test } from '@playwright/test'

import { type AuthRole, authFile } from './helpers'

const EXPECTED = {
  admin: ['Content health', 'Translation gaps'],
  editor: ['Content health', 'Translation gaps'],
  learner: ['Continue learning', 'Recommended for you'],
  owner: ['Pending invitations', 'Recent activity'],
  representative: ['Pending invitations', 'Recent activity'],
  tutor: ['Average review time', 'Oldest requests'],
  volunteer: ['Your certificate', 'Learn'],
} as const satisfies Record<AuthRole, readonly string[]>

const GREETING: Record<AuthRole, RegExp> = {
  admin: /Welcome back/u,
  editor: /Welcome back/u,
  learner: /Welcome back/u,
  owner: /Welcome back/u,
  representative: /Welcome back/u,
  tutor: /Welcome back/u,
  volunteer: /\S/u,
}

for (const role of Object.keys(EXPECTED) as AuthRole[]) {
  test.describe(role, () => {
    test.use({ storageState: authFile(role) })

    test('sees a dashboard built from real data', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard')
      await expect(page.getByRole('heading', { level: 2, name: GREETING[role] }).first()).toBeVisible()
      for (const text of EXPECTED[role]) {
        await expect(page.getByText(text, { exact: true }).first()).toBeVisible()
      }
      await expect(page.getByText('Something went wrong')).toBeHidden()
    })
  })
}
