import { expect, test } from '@playwright/test'

import {
  type Actor,
  actAs,
  certificateIdFromUrl,
  completeWizard,
  fillExperience,
  openDialog,
  pickSkills,
  rateOrganization,
  submitFromLastStep,
  tenantNames,
} from './actors'
import { type Tenant, certificateRow, createTenant, draftHours, removeTenant } from './tenant'

test.describe.configure({ mode: 'serial', timeout: 180_000 })

let tenant: Tenant
let volunteer: Actor
let tutor: Actor
let certificateId = 0
let code = ''

test.beforeAll(async ({ browser }) => {
  tenant = await createTenant('life', [
    { completedSkills: 3, key: 'volunteer', role: 'volunteer' },
    { key: 'tutor', role: 'tutor' },
  ])
  volunteer = await actAs(browser, tenant.users.volunteer!)
  tutor = await actAs(browser, tenant.users.tutor!)
})

test.afterAll(async () => {
  await volunteer?.close()
  await tutor?.close()
  if (tenant) await removeTenant(tenant)
})

test('volunteer resumes an autosaved draft and submits the request', async () => {
  const { page } = volunteer
  await page.goto('/certificates')
  await page.getByRole('link', { name: 'Request certificate' }).click()
  await expect(page).toHaveURL(/\/certificates\/new/u)
  await fillExperience(page)
  await expect.poll(() => draftHours(tenant.users.volunteer!.id)).toBe(120)

  await page.goto('/certificates')
  await page.getByRole('link', { name: 'Continue editing' }).first().click()
  await expect(page.getByLabel('Total hours')).toHaveValue('120')
  await expect(page.getByLabel('Where did it take place?')).toHaveValue('Milan, Italy')

  await page.getByRole('button', { name: 'Continue' }).click()
  await pickSkills(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await rateOrganization(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await submitFromLastStep(page)
  await expect(page.getByText(tenantNames(tenant, 'tutor'))).toBeVisible()
  certificateId = certificateIdFromUrl(page)
})

test('volunteer withdraws the request and submits a new one', async () => {
  const { page } = volunteer
  await page.goto(`/certificates/${certificateId}`)
  await page.getByRole('button', { name: 'Withdraw' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Withdraw request' }).click()
  await expect(page.getByText('Request withdrawn.')).toBeVisible()
  await expect.poll(async () => (await certificateRow(certificateId))?.status).toBe('withdrawn')

  await page.goto('/certificates')
  await page.getByRole('link', { name: 'Request certificate' }).click()
  await expect(page).toHaveURL(/\/certificates\/new/u)
  await completeWizard(page)
  certificateId = certificateIdFromUrl(page)
  await expect(page.getByText('Waiting for a reviewer to start.')).toBeVisible()
})

test('tutor sees the request in the queue and starts the review', async () => {
  const { page } = tutor
  await page.goto('/certificates')
  const row = page.getByRole('row').filter({ hasText: tenantNames(tenant, 'volunteer') })
  await expect(row).toBeVisible()
  await expect(row.getByText('Submitted', { exact: true })).toBeVisible()
  await expect(row.getByText('Today')).toBeVisible()
  await row.getByRole('link', { name: 'Review' }).click()
  await expect(page).toHaveURL(new RegExp(`/certificates/${certificateId}/review$`, 'u'))
  await page.getByRole('button', { name: 'Start review' }).click()
  await expect(page.getByText('Review started.')).toBeVisible()
})

test('tutor lowers a level, requests changes with a comment, and the volunteer resubmits', async () => {
  const { page } = tutor
  await page.goto(`/certificates/${certificateId}/review`)
  const confirmedLevels = page.getByRole('radiogroup', { name: 'Confirmed level' })
  await confirmedLevels.first().getByRole('radio', { name: 'Basic' }).click()
  await page
    .getByRole('textbox', { name: 'Statement' })
    .first()
    .fill('Showed a basic level of empathy during the shifts.')

  await page.getByRole('button', { name: 'Request changes' }).click()
  await expect(page.getByText('Add a comment before requesting changes.')).toBeVisible()
  await page.getByRole('textbox', { name: 'General comment' }).fill('Please describe your tasks in more detail.')
  await page.getByRole('button', { name: 'Request changes' }).click()
  await expect(page.getByText('Changes requested. The volunteer has been notified.')).toBeVisible()
  await expect(page).toHaveURL(/\/certificates$/u)

  const volunteerPage = volunteer.page
  await volunteerPage.goto(`/certificates/${certificateId}`)
  await expect(volunteerPage.getByText('The reviewer asked for changes before approving.')).toBeVisible()
  await expect(volunteerPage.getByText('Please describe your tasks in more detail.').first()).toBeVisible()
  await openDialog(
    volunteerPage.getByRole('link', { name: 'Edit and resubmit' }),
    volunteerPage.getByText('Your tutor asked for changes')
  )
  await expect(volunteerPage.getByText('Please describe your tasks in more detail.').first()).toBeVisible()
  await volunteerPage.getByRole('textbox', { name: 'Task 1' }).fill('Welcomed new volunteers and ran the check-in desk')
  for (let step = 0; step < 3; step++) await volunteerPage.getByRole('button', { name: 'Continue' }).click()
  await submitFromLastStep(volunteerPage, 'Resubmit')
})

test('tutor previews the PDF and approves, and the volunteer shares the certificate', async ({ browser }) => {
  const { page } = tutor
  await page.goto(`/certificates/${certificateId}/review`)
  await page.getByRole('button', { name: 'Start review' }).click()
  await expect(page.getByText('Review started.')).toBeVisible()
  for (const score of ['engagement', 'evidence', 'reflection', 'growth']) {
    await page.locator(`label[for="score-${score}-4"]`).click()
  }
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Certificate preview' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('object[type="application/pdf"]')).toBeVisible()
  await dialog.getByRole('button', { name: 'Approve and issue' }).click()
  await expect(page.getByText('Certificate approved and issued.')).toBeVisible()

  const volunteerPage = volunteer.page
  await volunteerPage.goto(`/certificates/${certificateId}`)
  await expect(volunteerPage.getByText('Approved and issued.')).toBeVisible()
  await expect(volunteerPage.getByRole('button', { name: 'Copy link' })).toBeVisible()
  const download = volunteerPage.getByRole('link', { name: 'Download PDF' })
  await expect(download).toBeVisible()
  const pdf = await volunteerPage.request.get((await download.getAttribute('href')) ?? '')
  expect(pdf.ok()).toBe(true)
  expect(pdf.headers()['content-type']).toContain('pdf')
  const shareHref = (await volunteerPage.getByRole('link', { name: 'Share on LinkedIn' }).getAttribute('href')) ?? ''
  code = decodeURIComponent(shareHref).match(/[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}/u)?.[0] ?? ''
  expect(code).not.toBe('')

  const guest = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  const guestPage = await guest.newPage()
  await guestPage.goto(`/verify/${code}`)
  await expect(guestPage.getByText('Valid certificate')).toBeVisible()
  await expect(guestPage.getByText(tenant.name).first()).toBeVisible()
  await guest.close()
})
