import { expect, test } from '@playwright/test'
import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import { authFile } from './helpers'

const slug = `e2e-levels-${Date.now().toString(36)}`
const text = (value: string) => JSON.stringify({ en: value, es: value, it: value })

const withPool = async <T>(run: (pool: Pool) => Promise<T>) => {
  const connectionString = process.env.DATABASE_URL
  if (!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString))) {
    throw new Error('Level description e2e only runs against the local database')
  }
  const pool = new Pool({ connectionString })
  try {
    return await run(pool)
  } finally {
    await pool.end()
  }
}

test.describe('level descriptions in the final assessment', () => {
  test.use({ storageState: authFile('editor') })
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await withPool(async pool => {
      const { rows } = await pool.query<{ id: number }>(
        `insert into courses (type, slug, title, description) values ('skill', $1, $2::jsonb, $2::jsonb) returning id`,
        [slug, text('Level course')]
      )
      await pool.query(`insert into lessons (course_id, title, sort_order) values ($1, $2::jsonb, 1)`, [
        rows[0]?.id,
        text('Lesson'),
      ])
    })
  })

  test.afterAll(async () => {
    await withPool(async pool => {
      await pool.query(
        `delete from content_translations where entity_type = 'lesson' and entity_id in (select l.id from lessons l join courses c on c.id = l.course_id where c.slug = $1)`,
        [slug]
      )
      await pool.query(
        'delete from assessments where lesson_id in (select l.id from lessons l join courses c on c.id = l.course_id where c.slug = $1)',
        [slug]
      )
      await pool.query('delete from lessons where course_id in (select id from courses where slug = $1)', [slug])
      await pool.query('delete from courses where slug = $1', [slug])
    })
  })

  test('adds the final assessment, writes the three levels, and keeps them', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    await page.getByRole('button', { name: 'Add activity' }).click()
    await page.getByRole('menuitem', { name: 'Final assessment' }).click()

    const intermediate = page.getByLabel('Intermediate')
    await intermediate.fill('I take part in the group and ask when I am unsure.')
    await expect(page.getByText('50 of 200 characters')).toBeVisible()
    await page.getByLabel('Good').fill('I help the group reach its goal.')
    await page.getByLabel('Advanced').fill('I guide the group when things are hard.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Good')).toHaveValue('I help the group reach its goal.')
  })

  test('limits each description to 200 characters and writes another language', async ({ page }) => {
    await page.goto(`/courses/${slug}`)
    const advanced = page.getByLabel('Advanced')
    await expect(async () => {
      await advanced.clear()
      await advanced.pressSequentially('x'.repeat(210))
      await expect(advanced).toHaveValue('x'.repeat(200), { timeout: 2000 })
    }).toPass()
    await expect(page.getByText('200 of 200 characters')).toBeVisible()

    await page.goto(`/courses/${slug}?lang=it`)
    await page.getByLabel('Good').fill('Aiuto il gruppo a raggiungere il suo obiettivo.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Course saved successfully')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Good')).toHaveValue('Aiuto il gruppo a raggiungere il suo obiettivo.')
  })
})
