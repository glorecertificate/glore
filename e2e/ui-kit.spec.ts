import { expect, test } from '@playwright/test'
import { Pool } from 'pg'

import { LOCAL_DATABASE_REGEX, SEED_ORG_HANDLE } from '~/scripts/seed-data'

import { authFile } from './helpers'

test.use({ storageState: authFile('owner') })

test('keeps the roster inside a mobile viewport with its actions reachable', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/organization?tab=members')
  const table = page.getByRole('table', { name: 'Members', exact: true })
  await expect(table).toBeVisible()
  const actions = table.getByRole('button', { name: /^Actions for /u })
  await expect(actions.first()).toBeVisible()
  const boxes = await actions.evaluateAll(elements =>
    elements.map(element => {
      const { left, right } = element.getBoundingClientRect()
      return { left, right }
    })
  )
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(390)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const container = table.locator('..')
  expect(await container.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('sorts the roster by a column header', async ({ page }) => {
  await page.goto('/organization?tab=members')
  const table = page.getByRole('table', { name: 'Members', exact: true })
  await expect(table).toBeVisible()
  const header = table.getByRole('columnheader', { name: 'Email', exact: true })
  await expect(async () => {
    await header.getByRole('button').click()
    await expect(header).toHaveAttribute('aria-sort', 'ascending', { timeout: 1000 })
  }).toPass()
  await header.getByRole('button').click()
  await expect(header).toHaveAttribute('aria-sort', 'descending')
})

test.describe('public certificate UI', () => {
  const connectionString = process.env.DATABASE_URL
  test.skip(!(connectionString && LOCAL_DATABASE_REGEX.test(connectionString)), 'Requires the local database')
  test.use({ storageState: { cookies: [], origins: [] } })
  const id = crypto.randomUUID()
  const username = `uikit.${id.replaceAll('-', '').slice(0, 16)}`
  const handle = `ui-kit-${id}`
  let pool: Pool | undefined

  test.beforeAll(async () => {
    pool = new Pool({ connectionString })
    await pool.query(
      'insert into users (id, email, username, name, first_name, last_name, public_profile) values ($1, $2, $3, $4, $5, $6, true)',
      [id, `${id}@glore.test`, username, 'UI Verification', 'UI', 'Verification']
    )
    const { rows: courses } = await pool.query<{ id: number }>(
      'insert into courses (slug, type, title) values ($1, $2, $3) returning id',
      [handle, 'skill', { en: 'UI verification', es: 'Verificación visual', it: 'Verifica visiva' }]
    )
    const { rows: certificates } = await pool.query<{ id: number }>(
      `insert into certificates (handle, user_id, organization_id, language, activity_start_date, activity_end_date, activity_duration, activity_location, activity_description, status, issued_at, is_default)
       select $1, $2, id, 'en', '2026-01-01', '2026-04-01', 120, 'Milan', 'Local UI verification fixture', 'approved', now(), true
       from organizations where handle = $3 returning id`,
      [handle, id, SEED_ORG_HANDLE]
    )
    await pool.query('insert into certificate_skills (certificate_id, course_id, level) values ($1, $2, $3)', [
      certificates[0].id,
      courses[0].id,
      4,
    ])
  })

  test.afterAll(async () => {
    if (!pool) return
    try {
      await pool.query('delete from certificates where handle = $1 and user_id = $2', [handle, id])
      await pool.query('delete from courses where slug = $1', [handle])
      await pool.query('delete from users where id = $1', [id])
    } finally {
      await pool.end()
    }
  })

  test('renders levels and a QR code across the server boundary', async ({ page }) => {
    const response = await page.goto(`/${username}`)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('[data-slot=level-dots]')).toContainText('Good')
    await expect(page.locator('[data-slot=qr-code] img')).toBeVisible()
  })
})
