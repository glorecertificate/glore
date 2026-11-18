import { test } from '@playwright/test'

import {
  PROFILE_NAMES,
  type PerfRole,
  RUNS,
  openContext,
  openMobileNav,
  readNavigation,
  record,
  resetMarks,
  sampleTargets,
  settle,
  summarize,
  targetCount,
} from './vitals'

const NAVIGATIONS: { from: string; link: string; role: PerfRole; to: string }[] = [
  { from: '/dashboard', link: 'Certificates', role: 'volunteer', to: '/certificates' },
  { from: '/dashboard', link: 'Courses', role: 'volunteer', to: '/courses' },
  { from: '/certificates', link: 'Dashboard', role: 'tutor', to: '/dashboard' },
  { from: '/dashboard', link: 'Organization', role: 'owner', to: '/organization' },
  { from: '/admin', link: 'Users', role: 'admin', to: '/admin/users' },
]

for (const profile of PROFILE_NAMES) {
  for (const { from, link, role, to } of NAVIGATIONS) {
    test(`navigation ${profile} ${role} ${from} to ${to}`, async ({ baseURL, browser }) => {
      test.setTimeout(60_000 * RUNS * targetCount())
      const results = await sampleTargets(baseURL ?? '', async url => {
        const { context, page } = await openContext(browser, url, profile, role)
        try {
          await page.goto(from)
          await settle(page)
          await openMobileNav(page, profile)
          await resetMarks(page)
          await page.getByRole('link', { exact: true, name: link }).first().click()
          return [await readNavigation(page, to)]
        } finally {
          await context.close()
        }
      })
      for (const { dir, runs } of results) {
        await record(
          `navigation ${profile} ${role} ${from} to ${to}`,
          { from, kind: 'navigation', ...summarize(runs), profile, role, runs: runs.length, to },
          dir
        )
      }
    })
  }
}
