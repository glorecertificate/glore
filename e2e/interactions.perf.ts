import { type Page, test } from '@playwright/test'

import {
  PROFILE_NAMES,
  type PerfRole,
  type ProfileName,
  RUNS,
  nextFrame,
  openContext,
  readInteraction,
  record,
  resetMarks,
  sampleTargets,
  settle,
  summarize,
  targetCount,
} from './vitals'

interface Interaction {
  act: (page: Page, run: number) => Promise<void>
  done: (page: Page, run: number) => Promise<void>
  name: string
  path: string
  profiles: ProfileName[]
  reset?: (page: Page) => Promise<void>
  role: PerfRole
}

const escape = async (page: Page) => await page.keyboard.press('Escape')

const closeSheet = async (page: Page) => {
  const sheet = page.locator('[data-mobile="true"]')
  for (const _ of Array.from({ length: 3 })) {
    if (!(await sheet.count())) return
    await page.keyboard.press('Escape')
    try {
      await sheet.waitFor({ state: 'detached', timeout: 1000 })
    } catch {
      continue
    }
  }
}

const SETTINGS_TABS = ['Account', 'Profile']

const INTERACTIONS: Interaction[] = [
  {
    act: async page => await page.keyboard.press('ControlOrMeta+k'),
    done: async page => await page.getByPlaceholder(/Search pages, courses/u).waitFor(),
    name: 'open the command palette',
    path: '/dashboard',
    profiles: ['desktop'],
    reset: escape,
    role: 'volunteer',
  },
  {
    act: async page => await page.getByRole('button', { name: /^Notifications/u }).click(),
    done: async page => await page.getByRole('link', { name: 'View all notifications' }).waitFor(),
    name: 'open the notification popover',
    path: '/dashboard',
    profiles: ['desktop'],
    reset: escape,
    role: 'volunteer',
  },
  {
    act: async (page, run) =>
      await page.getByRole('tab', { exact: true, name: SETTINGS_TABS[run % 2] ?? 'Account' }).click(),
    done: async (page, run) =>
      await page
        .locator(`[role="tab"][aria-selected="true"]`, { hasText: SETTINGS_TABS[run % 2] ?? 'Account' })
        .waitFor(),
    name: 'switch a settings tab',
    path: '/settings',
    profiles: ['desktop', 'mobile'],
    role: 'volunteer',
  },
  {
    act: async page => await page.locator('[data-sidebar="trigger"]').first().click(),
    done: async page => await nextFrame(page),
    name: 'toggle the sidebar',
    path: '/dashboard',
    profiles: ['desktop', 'mobile'],
    reset: closeSheet,
    role: 'tutor',
  },
]

for (const profile of PROFILE_NAMES) {
  for (const interaction of INTERACTIONS.filter(candidate => candidate.profiles.includes(profile))) {
    test(`interaction ${profile} ${interaction.role} ${interaction.name}`, async ({ baseURL, browser }) => {
      test.setTimeout(120_000 * targetCount())
      const results = await sampleTargets(
        baseURL ?? '',
        async url => {
          const { context, page } = await openContext(browser, url, profile, interaction.role)
          const runs = []
          try {
            await page.goto(interaction.path)
            await settle(page)
            for (const [run] of Array.from({ length: RUNS }).entries()) {
              await resetMarks(page)
              await interaction.act(page, run)
              await interaction.done(page, run)
              runs.push(await readInteraction(page))
              await interaction.reset?.(page)
              await settle(page, 300)
            }
          } finally {
            await context.close()
          }
          return runs
        },
        1
      )
      for (const { dir, runs } of results) {
        await record(
          `interaction ${profile} ${interaction.role} ${interaction.name}`,
          {
            kind: 'interaction',
            ...summarize(runs),
            name: interaction.name,
            path: interaction.path,
            profile,
            role: interaction.role,
            runs: runs.length,
          },
          dir
        )
      }
    })
  }
}
