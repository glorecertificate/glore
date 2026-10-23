import { expect, test } from '@playwright/test'

import { deleteCourseBySlug } from './db'
import { authFile } from './helpers'

const slug = `e2e-course-${Date.now().toString(36)}`

test.describe('course editor', () => {
  test.use({ storageState: authFile('editor') })
  test.describe.configure({ mode: 'serial' })

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

test.describe('course editor AI menu', () => {
  test.use({ storageState: authFile('editor') })

  test('streams the whole suggestion into the preview', async ({ page }) => {
    await page.addInitScript(() => {
      const original = window.fetch
      window.fetch = (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (!url.includes('/api/v1/ai/command')) return original(input, init)
        const words = ['Culture ', 'is ', 'a ', 'lens, ', 'not ', 'a ', 'label.']
        const events = [
          { type: 'start' },
          { id: '0', type: 'text-start' },
          ...words.map(delta => ({ delta, id: '0', type: 'text-delta' })),
          { id: '0', type: 'text-end' },
          { type: 'finish' },
        ]
        const encoder = new TextEncoder()
        const body = new ReadableStream({
          start: async controller => {
            for (const event of events) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
              await new Promise(resolve => setTimeout(resolve, 50))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        })
        return Promise.resolve(
          new Response(body, {
            headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
          })
        )
      }
    })

    await page.goto('/courses/intercultural-learning')
    const paragraph = page.locator('[data-slate-editor]').getByText('Culture is not a label', { exact: false })
    await expect(paragraph).toBeVisible()
    await paragraph.click({ clickCount: 3 })
    await page.getByRole('button', { name: 'Ask AI' }).click()
    await page.getByRole('option', { name: 'Improve writing' }).click()
    await expect(page.getByText('Culture is a lens, not a label.')).toBeVisible()
    await page.getByRole('option', { name: 'Discard' }).click()
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
