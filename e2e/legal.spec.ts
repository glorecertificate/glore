import { type Page, expect, test } from '@playwright/test'

import { resetLegal } from './db'
import { authFile, hydrated } from './helpers'

test.describe.configure({ mode: 'serial' })

test.beforeAll(resetLegal)
test.afterAll(resetLegal)

const openDocument = async (page: Page, document: string) => {
  await page.goto(`/legal?document=${document}`)
  const current = page.getByTestId('legal-current').filter({ visible: true })
  await expect(current).toBeVisible()
  await hydrated(current)
}

const createDraft = async (page: Page, document: string) => {
  await openDocument(page, document)
  await page.getByTestId('legal-create-draft').click()
  await expect(page.getByTestId('legal-draft')).toBeVisible()
}

const appendToEnglishBody = async (page: Page, addition: string) => {
  const body = page.getByLabel('Text (Markdown)')
  await body.fill(`${await body.inputValue()}\n\n${addition}`)
  await page.getByRole('button', { name: 'Save English' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
}

test.describe('an editor', () => {
  test.use({ storageState: authFile('editor') })

  test('drafts and edits a document but cannot publish it', async ({ page }) => {
    await createDraft(page, 'quality-charter')
    await appendToEnglishBody(page, 'Drafted by an editor.')

    await expect(page.getByTestId('legal-publish')).toHaveCount(0)
    await expect(page.getByText('Only platform admins can publish a version.')).toBeVisible()

    await page.getByTestId('legal-discard').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard draft' }).click()
    await expect(page.getByTestId('legal-draft')).toHaveCount(0)
    await expect(page.getByTestId('legal-create-draft')).toBeVisible()
  })
})

test.describe('an admin', () => {
  test.use({ storageState: authFile('admin') })

  test('publishes version 2 and the public date changes', async ({ browser, page }) => {
    const anonymous = await browser.newPage({ baseURL: test.info().project.use.baseURL, ignoreHTTPSErrors: true })
    await anonymous.goto('/privacy')
    await expect(anonymous.getByTestId('legal-updated')).toBeVisible()

    await createDraft(page, 'privacy')
    await appendToEnglishBody(page, 'Added in version two.')

    await page.getByTestId('legal-publish').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Effective date').fill('2026-12-01')
    await dialog.getByLabel('Change note').fill('Clarified retention')
    await dialog.getByTestId('legal-publish-confirm').click()
    await expect(page.getByText('Version 2 published')).toBeVisible()

    await expect(page.getByTestId('legal-current-date')).toContainText('December 1, 2026')
    await expect(page.getByTestId('legal-history')).toContainText('Version 1, Replaced')
    await expect(page.getByTestId('legal-history')).toContainText('Clarified retention')

    await anonymous.goto('/privacy')
    await expect(anonymous.getByTestId('legal-updated')).toContainText('December 1, 2026')
    await expect(anonymous.getByTestId('legal-body')).toContainText('Added in version two.')
    await anonymous.close()
  })

  test('refuses to publish translations with different headings', async ({ page }) => {
    await createDraft(page, 'quality-charter')
    await page.getByRole('tab', { name: 'Español' }).click()
    await page.getByLabel('Text (Markdown)').fill('## Una sola sección\n\nTexto.')
    await page.getByRole('button', { name: 'Save Español' }).click()
    await expect(page.getByText('Saved', { exact: true })).toBeVisible()

    await page.getByTestId('legal-publish').click()
    await page.getByRole('dialog').getByTestId('legal-publish-confirm').click()
    await expect(page.getByText(/headings of ES do not match/u)).toBeVisible()

    await page.keyboard.press('Escape')
    await page.getByTestId('legal-discard').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard draft' }).click()
    await expect(page.getByTestId('legal-draft')).toHaveCount(0)
  })

  test('a material terms version asks everyone to accept again', async ({ browser, page }) => {
    await createDraft(page, 'terms')
    await appendToEnglishBody(page, 'A material change to the terms.')

    await page.getByTestId('legal-publish').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('switch').click()
    await dialog.getByLabel('Change note').fill('New liability section')
    await dialog.getByTestId('legal-publish-confirm').click()
    await expect(page.getByText('Version 2 published')).toBeVisible()

    await expect(page).toHaveURL(/\/legal\/accept$/u)
    await expect(page.getByTestId('legal-accept-body')).toContainText('A material change to the terms.')
    await expect(page.getByTestId('legal-accept-submit')).toBeDisabled()
    await page.getByTestId('legal-accept-checkbox').click()
    await page.getByTestId('legal-accept-submit').click()
    await expect(page).toHaveURL(/\/dashboard/u)

    const volunteer = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      ignoreHTTPSErrors: true,
      storageState: authFile('volunteer'),
    })
    const volunteerPage = await volunteer.newPage()
    await volunteerPage.goto('/dashboard')
    await expect(volunteerPage).toHaveURL(/\/legal\/accept$/u)
    await volunteerPage.goto('/courses')
    await expect(volunteerPage).toHaveURL(/\/legal\/accept$/u)

    await volunteerPage.getByTestId('legal-accept-checkbox').click()
    await volunteerPage.getByTestId('legal-accept-submit').click()
    await expect(volunteerPage).toHaveURL(/\/dashboard/u)
    await volunteerPage.goto('/courses')
    await expect(volunteerPage).toHaveURL(/\/courses/u)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/u)
    await volunteer.close()
  })

  test('a later minor version does not ask people who accepted the material one', async ({ browser, page }) => {
    await createDraft(page, 'terms')
    await appendToEnglishBody(page, 'A minor clarification.')
    await page.getByTestId('legal-publish').click()
    await page.getByRole('dialog').getByTestId('legal-publish-confirm').click()
    await expect(page.getByText('Version 3 published')).toBeVisible()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/u)

    const tutor = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      ignoreHTTPSErrors: true,
      storageState: authFile('tutor'),
    })
    const tutorPage = await tutor.newPage()
    await tutorPage.goto('/dashboard')
    await expect(tutorPage).toHaveURL(/\/legal\/accept$/u)
    await tutor.close()
  })

  test('shows the legal events in the audit log', async ({ page }) => {
    await page.goto('/admin/audit?category=legal')
    await expect(page.getByText(/published terms v2/u).first()).toBeVisible()
    await expect(page.getByText(/accepted terms v2/u).first()).toBeVisible()
  })
})
