import { expect, test } from '@playwright/test'

import { authFile } from './helpers'
import { clearMail, isMailpitUp, latestMailText, mailLinkPath } from './mail'

test.use({ storageState: { cookies: [], origins: [] } })

test('takes an application from the register form to onboarding', async ({ browser, page, request }) => {
  test.skip(!(await isMailpitUp(request)), 'Mailpit is not running (pnpm run mail:up)')

  const stamp = Date.now()
  const applicant = `applicant-${stamp}@applicants.glore.test`
  const organizationName = `E2E Application ${stamp}`
  await clearMail(request, applicant)

  await page.goto('/register')
  await page.getByLabel('Organization name', { exact: true }).fill(organizationName)
  await page.getByLabel('Legal name', { exact: true }).fill(`${organizationName} APS`)
  await page.getByLabel('Registry ID', { exact: true }).fill(`IT-${stamp}`)
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: /Italy/u }).click()
  await page.getByLabel('City', { exact: true }).fill('Milan')
  await page.getByLabel('Organization email', { exact: true }).fill(`info-${stamp}@applicants.glore.test`)
  await page.getByLabel('Volunteers per year', { exact: true }).fill('40')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel('First name', { exact: true }).fill('Maria')
  await page.getByLabel('Last name', { exact: true }).fill('Rossi')
  await page.getByLabel('Your email address', { exact: true }).fill(applicant)
  await page.getByRole('button', { name: 'Continue' }).click()

  await page
    .getByLabel('Motivation', { exact: true })
    .fill('We run youth exchanges and want to certify the skills volunteers gain.')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText(organizationName).first()).toBeVisible()
  await page.getByRole('button', { name: 'Send application' }).click()
  await expect(page.getByText('You need to accept the Quality Charter to apply.')).toBeVisible()

  await page.getByRole('checkbox', { name: 'I accept the Quality Charter' }).check()
  await page.getByRole('button', { name: 'Send application' }).click()
  await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible()
  expect(await latestMailText(request, applicant)).toContain(organizationName)
  await clearMail(request, applicant)

  const adminPage = await browser.newPage({
    baseURL: test.info().project.use.baseURL,
    ignoreHTTPSErrors: true,
    storageState: authFile('admin'),
  })
  await adminPage.goto('/admin/organizations')
  const row = adminPage.getByRole('link', { name: organizationName }).locator('..')
  await row.getByRole('button', { name: 'Actions' }).click()
  await adminPage.getByRole('menuitem', { name: 'View application' }).click()
  const sheet = adminPage.getByRole('dialog')
  await expect(sheet.getByText(`${organizationName} APS`)).toBeVisible()
  await expect(sheet.getByText(`IT-${stamp}`)).toBeVisible()
  await expect(sheet.getByText('Maria Rossi')).toBeVisible()
  await sheet.getByRole('button', { name: 'Approve' }).click()
  await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Approve' }).click()
  await expect(adminPage.getByText(`${organizationName} has been approved.`)).toBeVisible()
  await adminPage.close()

  await page.goto(mailLinkPath(await latestMailText(request, applicant), '/invite/'))
  await page.getByRole('button', { name: 'Create account and accept' }).click()
  await expect(page).toHaveURL(/\/onboarding/u)
})
