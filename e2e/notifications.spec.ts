import { expect, test } from '@playwright/test'

import { authFile } from './helpers'
import { clearNotifications, resetNotifications } from './notifications'

test.describe('notifications', () => {
  test.use({ storageState: authFile('learner') })
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async () => {
    await resetNotifications('learner', ['course.completed', 'learning.eligible'])
  })

  test.afterAll(async () => {
    await clearNotifications('learner')
  })

  test('shows the unread count and clears it with mark all as read', async ({ page }) => {
    await page.goto('/dashboard')
    const bell = page.getByRole('button', { name: /Notifications, 2 unread/u })
    await expect(bell).toBeVisible()

    await bell.click()
    await expect(page.getByText('Course completed')).toBeVisible()
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
  })

  test('marks a notification read when it opens and keeps the state on the inbox page', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    await expect(page.getByRole('listitem').getByText('Unread', { exact: true })).toHaveCount(2)

    await page.getByRole('link', { name: /Course completed/u }).click()
    await expect(page).toHaveURL(/\/courses/u)

    await page.goto('/notifications?filter=unread')
    await expect(page.getByRole('link', { name: /Course completed/u })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /You can request your certificate/u })).toBeVisible()
  })

  test('shows an empty state when everything is read', async ({ page }) => {
    await page.goto('/notifications')
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await page.goto('/notifications?filter=unread')
    await expect(page.getByText('No unread notifications')).toBeVisible()
  })
})
