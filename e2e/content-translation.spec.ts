import { expect, test } from '@playwright/test'

import { deleteCourseBySlug } from './db'
import { authFile } from './helpers'

const slug = `e2e-translation-${Date.now().toString(36)}`

test.describe('content translation status', () => {
  test.use({ storageState: authFile('editor') })
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    await deleteCourseBySlug(slug)
  })

  test('creates a course and saves its English text', async ({ page }) => {
    await page.goto('/courses')
    await page.getByRole('button', { name: 'Create course' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('input.font-mono').fill(slug)
    await dialog.getByRole('spinbutton').fill('30')
    await dialog.getByPlaceholder('Recognize active listening techniques').first().fill('Plan a team meeting')
    await dialog.getByRole('button', { name: 'Create course' }).click()
    await expect(page).toHaveURL(new RegExp(`/courses/${slug}`, 'u'))

    const title = page.locator('textarea').first()
    await title.fill('Translation course')
    await title.blur()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()
  })

  test('hides the translation status on the default language', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    await expect(page.getByRole('button', { name: 'Translation' })).toBeHidden()
  })

  test('shows hand-written Spanish as needing review, then reviewed', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    await page.getByRole('tab', { name: /Spanish/u }).click()

    const trigger = page.getByRole('button', { name: 'Translation' })
    await expect(trigger).toContainText('Needs review')
    await trigger.click()

    const panel = page.locator('[data-slot="translation-panel"]')
    await expect(panel.getByText('written by hand', { exact: false })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Translate with AI' })).toBeVisible()
    await panel.getByRole('button', { name: 'Mark as reviewed' }).click()

    await expect(page.getByText('Spanish marked as reviewed.')).toBeVisible()
    await expect(trigger).toContainText('Reviewed')
    await expect(panel.getByRole('button', { name: 'Mark as reviewed' })).toBeDisabled()
  })

  test('turns a manual Spanish edit back into a draft', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    await page.getByRole('tab', { name: /Spanish/u }).click()
    await expect(page.getByRole('button', { name: 'Translation' })).toContainText('Reviewed')

    const spanishTitle = page.locator('textarea').first()
    await spanishTitle.fill('Curso de traduccion')
    await spanishTitle.blur()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Translation' })).toContainText('Needs review')
  })

  test('marks Spanish as outdated after the English text changes', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    await page.getByRole('tab', { name: /Spanish/u }).click()
    await page.getByRole('button', { name: 'Translation' }).click()
    await page.locator('[data-slot="translation-panel"]').getByRole('button', { name: 'Mark as reviewed' }).click()
    await expect(page.getByRole('button', { name: 'Translation' })).toContainText('Reviewed')
    await page.keyboard.press('Escape')

    await page.getByRole('tab', { name: /English/u }).click()
    const title = page.locator('textarea').first()
    await title.fill('Translation course renamed')
    await title.blur()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await page.getByRole('tab', { name: /Spanish/u }).click()
    await expect(page.getByRole('button', { name: 'Translation' })).toContainText('Outdated')
  })

  test.describe('platform admin', () => {
    test.use({ storageState: authFile('admin') })

    test('sees the review in the audit log', async ({ page }) => {
      await page.goto('/admin/audit')
      const row = page
        .getByRole('row')
        .filter({ hasText: /translation of/u })
        .filter({ has: page.locator(`a[href$="/courses/${slug}"]`) })
      await expect(row.first()).toBeVisible()
      await expect(row.first()).toContainText(/marked the Spanish translation/u)
    })
  })
})
