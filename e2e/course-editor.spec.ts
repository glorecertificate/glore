import { expect, test } from '@playwright/test'

import { deleteCourseBySlug } from './db'
import { authFile } from './helpers'

const slug = `e2e-course-${Date.now().toString(36)}`

test.describe('course editor', () => {
  test.use({ storageState: authFile('editor') })

  test.afterAll(async () => {
    await deleteCourseBySlug(slug)
  })

  test('creates, translates, and publishes a course', async ({ page }) => {
    await page.goto('/courses')
    await page.getByRole('button', { name: 'Create course' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('input.font-mono').fill(slug)
    await dialog.getByRole('spinbutton').fill('30')
    await dialog.getByPlaceholder('Recognize active listening techniques').first().fill('Plan a team meeting')
    await dialog.getByRole('button', { name: 'Create course' }).click()
    await expect(page).toHaveURL(new RegExp(`/courses/${slug}`, 'u'))

    const title = page.locator('textarea').first()
    await expect(title).toHaveValue('New Course')
    await title.fill('E2E course')
    await title.blur()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await page.getByRole('tab', { name: /Spanish/u }).click()
    const spanishTitle = page.locator('textarea').first()
    await expect(spanishTitle).toHaveValue('Nuevo Curso')
    await spanishTitle.fill('Curso E2E')
    await spanishTitle.blur()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await page.getByRole('switch', { name: 'Draft' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    const publishAnyway = page.getByRole('button', { name: 'Publish anyway' })
    if (await publishAnyway.isVisible()) await publishAnyway.click()
    await expect(page.getByRole('switch', { name: 'Published' })).toBeVisible()

    await page.goto('/courses')
    await expect(page.getByText('E2E course').first()).toBeVisible()
  })

  test('previews the saved course as a learner without saving anything', async ({ page }) => {
    await page.goto(`/courses/${slug}/learn`)
    await expect(page).toHaveURL(new RegExp(`/courses/${slug}/learn`, 'u'))
    await expect(page.getByText('nothing is saved', { exact: false })).toBeVisible()
  })

  test('opens the skill framework', async ({ page }) => {
    await page.goto('/courses/skills')
    await expect(page.getByRole('heading', { name: 'Skill framework' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add group' })).toBeVisible()
  })
})

test.describe('volunteer', () => {
  test.use({ storageState: authFile('volunteer') })

  test('cannot create courses or open the skill framework', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByRole('button', { name: 'Create course' })).toBeHidden()
    await page.goto('/courses/skills')
    await expect(page.getByRole('heading', { name: 'Skill framework' })).toBeHidden()
  })
})
