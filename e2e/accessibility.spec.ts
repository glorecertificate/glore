import { test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { expectAccessible } from './axe'
import { clearRateLimits, removePublicCertificates, seedPublicCertificate } from './db'
import { type AuthRole, authFile } from './helpers'
import { withDb } from './tenant'

const CODE = 'E2E0-A11Y-0000'

const PAGES: { paths: string[]; role: AuthRole | null }[] = [
  { paths: ['/login', '/verify', '/privacy', '/terms'], role: null },
  {
    paths: ['/dashboard', '/courses', '/certificates', '/certificates/new', '/notifications', '/settings'],
    role: 'volunteer',
  },
  { paths: ['/dashboard', '/certificates'], role: 'tutor' },
  { paths: ['/organization', '/organization?tab=members'], role: 'owner' },
  { paths: ['/courses', '/courses/skills', '/translations'], role: 'editor' },
  { paths: ['/admin', '/admin/users', '/admin/organizations'], role: 'admin' },
]

const firstSkillSlug = async () =>
  await withDb(async pool => {
    const { rows } = await pool.query<{ slug: string }>(
      `select slug from courses where type = 'skill' and archived_at is null order by sort_order, id limit 1`
    )
    return rows[0]?.slug ?? ''
  })

test.describe('accessibility', () => {
  test.describe('verification', () => {
    test.describe.configure({ mode: 'serial' })

    test.beforeAll(async () => {
      await clearRateLimits()
      await seedPublicCertificate({ code: CODE, email: seedEmail('volunteer'), status: 'approved' })
    })

    test.afterAll(async () => {
      await removePublicCertificates([CODE])
    })

    test('has no serious issues on a valid certificate', async ({ page }) => {
      await expectAccessible(page, `/verify/${CODE}`)
    })
  })

  for (const { paths, role } of PAGES) {
    test.describe(role ?? 'anonymous', () => {
      test.use({ storageState: role ? authFile(role) : { cookies: [], origins: [] } })

      for (const path of paths) {
        test(`has no serious issues on ${path}`, async ({ page }) => {
          await expectAccessible(page, path)
        })
      }
    })
  }

  test.describe('learner', () => {
    test.use({ storageState: authFile('learner') })

    test('has no serious issues on a course and its player', async ({ page }) => {
      const slug = await firstSkillSlug()
      await expectAccessible(page, `/courses/${slug}`)
      await expectAccessible(page, `/courses/${slug}/learn`)
    })
  })
})
