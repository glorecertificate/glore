import { expect, test } from '@playwright/test'

import { createSeedInvitation, deleteUserByEmail } from './db'
import { hydrated } from './helpers'
import { clearMail, isMailpitUp, latestMailText, mailLinkPath } from './mail'

const email = `onboarding-${Date.now()}@seed.glore.test`
const password = `Onboard-${Date.now()}!a`
const lastName = `Lovelace${Date.now()}`

test.afterAll(async () => {
  await deleteUserByEmail(email)
})

test('takes an invited volunteer from the invitation to the dashboard', async ({ page, request }) => {
  test.skip(!(await isMailpitUp(request)), 'Mailpit is not running (pnpm run mail:up)')

  await clearMail(request, email)
  const token = await createSeedInvitation(email, 'volunteer')

  await page.goto(`/invite/${token}`)
  const send = page.getByRole('button', { name: 'Send me a confirmation link' })
  await hydrated(send)
  await send.click()
  await expect(page.getByText(`We sent a confirmation link to ${email}`)).toBeVisible()

  await page.goto(mailLinkPath(await latestMailText(request, email), '/invite/'))
  const accept = page.getByRole('button', { name: 'Create account and accept' })
  await hydrated(accept)
  await accept.click()
  await expect(page).toHaveURL(/\/onboarding/u)

  await expect(page.getByRole('heading', { name: "What's your name?" })).toBeVisible()
  await page.getByLabel('First name').fill('Ada')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Last name is required.')).toBeVisible()
  await page.getByLabel('Last name').fill(lastName)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'A little about you' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Birthday is required.')).toBeVisible()
  await page.getByRole('button', { name: 'Birthday' }).click()
  await page.getByRole('combobox', { name: 'Choose the Year' }).selectOption({ label: '1990' })
  await page.getByRole('gridcell', { name: '15' }).first().click()
  await page.getByLabel('Place of birth').fill('London, United Kingdom')
  await page.getByRole('combobox', { name: 'Nationality' }).click()
  await page.getByPlaceholder('Search country…').fill('United Kingdom')
  await page.getByRole('option', { name: '🇬🇧 United Kingdom' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'How can we reach you?' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Secure your account' })).toBeVisible()
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Finish' }).click()

  await expect(page.getByTestId('onboarding-welcome')).toBeVisible()
  await expect(page.getByTestId('onboarding-username')).toHaveText(`ada.${lastName.toLowerCase()}`)
  await expect(page.getByRole('link', { name: 'Open your skill compass' })).toBeVisible()

  await expect.poll(() => latestMailText(request, email)).toContain(`ada.${lastName.toLowerCase()}`)

  await page.getByRole('link', { name: 'Go to the dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard/u)
})
