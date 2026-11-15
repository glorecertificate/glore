import { test } from '@playwright/test'

import {
  PROFILE_NAMES,
  type PerfRole,
  RUNS,
  expectPath,
  openContext,
  readLoad,
  record,
  sampleTargets,
  settle,
  summarize,
  targetCount,
} from './vitals'

const PAGES: { path: string; role: PerfRole }[] = [
  { path: '/login', role: 'guest' },
  { path: '/verify', role: 'guest' },
  { path: '/dashboard', role: 'volunteer' },
  { path: '/courses', role: 'learner' },
  { path: '/certificates', role: 'tutor' },
  { path: '/organization', role: 'owner' },
  { path: '/admin', role: 'admin' },
]

for (const profile of PROFILE_NAMES) {
  for (const { path, role } of PAGES) {
    test(`load ${profile} ${role} ${path}`, async ({ baseURL, browser }) => {
      test.setTimeout(60_000 * RUNS * targetCount())
      const results = await sampleTargets(baseURL ?? '', async url => {
        const { context, page } = await openContext(browser, url, profile, role)
        try {
          await page.goto(path)
          await settle(page)
          expectPath(page, path)
          return [await readLoad(page)]
        } finally {
          await context.close()
        }
      })
      for (const { dir, runs } of results) {
        await record(
          `load ${profile} ${role} ${path}`,
          {
            devMode: runs.some(run => run.devMode),
            kind: 'load',
            ...summarize(runs),
            path,
            profile,
            role,
            runs: runs.length,
          },
          dir
        )
      }
    })
  }
}
