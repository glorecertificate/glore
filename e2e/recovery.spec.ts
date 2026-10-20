import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { clearMail, isMailpitUp, latestMailText, mailLinkPath } from './mail'

test('resets a password through the emailed link', async ({ page, request }) => {
  test.skip(!(await isMailpitUp(request)), 'Mailpit is not running (pnpm run mail:up)')

  const email = seedEmail('recovery')
  const password = `Recovery-${Date.now()}`
  await clearMail(request, email)

  await page.goto('/login')
  await page.getByRole('button', { name: 'Forgot your password?' }).click()
  await page.locator('input[name="username"]').fill(email)
  await page.locator('form button[type="submit"]').click()

  await page.goto(mailLinkPath(await latestMailText(request, email), 'reset-password'))
  await page.locator('input[name="password"]').fill(password)
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Your password has been updated')).toBeVisible()

  await page.getByRole('button', { name: 'Go to login' }).click()
  await page.locator('input[name="username"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('form button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/u)
})
