import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { AUTH_ROLES, type AuthRole, authFile, hydrated } from './helpers'

const SETTINGS_TABS = [
  { label: 'Profile', value: 'profile' },
  { label: 'Account', value: 'account' },
  { label: 'Privacy', value: 'privacy' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Security', value: 'security' },
  { label: 'Your data', value: 'data' },
] as const

const HOME_PAGE = {
  admin: '/admin',
  editor: '/courses',
  learner: '/courses',
  owner: '/organization',
  representative: '/organization',
  tutor: '/certificates',
  volunteer: '/certificates',
} as const satisfies Record<AuthRole, string>

const PALETTE_TARGET = {
  admin: { name: 'Users', url: /\/admin\/users/u },
  editor: { name: 'Skills framework', url: /\/courses\/skills/u },
  learner: { name: 'Courses', url: /\/courses/u },
  owner: { name: 'Organization', url: /\/organization/u },
  representative: { name: 'Organization', url: /\/organization/u },
  tutor: { name: 'Certificates', url: /\/certificates/u },
  volunteer: { name: 'Certificates', url: /\/certificates/u },
} as const satisfies Record<AuthRole, { name: string; url: RegExp }>

const DARK_PAGES = ['/dashboard', '/settings'] as const

for (const role of AUTH_ROLES) {
  test.describe(`every role: ${role}`, () => {
    test.use({ storageState: authFile(role) })
    test.describe.configure({ timeout: 90_000 })

    test('renders in dark mode without losing its content', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
      for (const path of [...DARK_PAGES, HOME_PAGE[role]]) {
        await page.goto(path)
        await expect(page.locator('html')).toHaveClass(/dark/u)
        await expect(page.locator('main').last()).toBeVisible()
        const brightness = await page.locator('body').evaluate(body => {
          const canvas = document.createElement('canvas')
          canvas.width = 1
          canvas.height = 1
          const context = canvas.getContext('2d')
          if (!context) return 255
          context.fillStyle = getComputedStyle(body).backgroundColor
          context.fillRect(0, 0, 1, 1)
          return Math.max(...context.getImageData(0, 0, 1, 1).data.slice(0, 3))
        })
        expect(brightness, `${path} keeps a dark background`).toBeLessThan(110)
        await expect(page.getByText('Something went wrong')).toBeHidden()
      }
    })

    test('fits a 390px viewport without horizontal scrolling', async ({ page }) => {
      await page.setViewportSize({ height: 844, width: 390 })
      for (const path of ['/dashboard', HOME_PAGE[role], '/settings', '/notifications']) {
        await page.goto(path)
        await expect(page.locator('main').last()).toBeVisible()
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0)
      }
    })

    test('opens the command palette and reaches a setting and a role page', async ({ page }) => {
      const target = PALETTE_TARGET[role]
      const search = page.getByPlaceholder(/Search pages, courses/u)
      await page.goto('/dashboard')
      await hydrated(page.locator('main').last())

      await expect(async () => {
        await page.keyboard.press('ControlOrMeta+k')
        await expect(search).toBeVisible({ timeout: 1500 })
      }).toPass()
      await search.fill('Settings')
      await page.getByRole('option', { name: 'Settings' }).first().click()
      await expect(page).toHaveURL(/\/settings/u)

      await expect(async () => {
        await page.keyboard.press('ControlOrMeta+k')
        await expect(search).toBeVisible({ timeout: 1500 })
      }).toPass()
      await search.fill(target.name)
      await page.getByRole('option', { name: target.name }).first().click()
      await expect(page).toHaveURL(target.url)
    })

    test('opens the notification center from the bell and from the inbox page', async ({ page }) => {
      await page.goto('/dashboard')
      const bell = page.getByRole('button', { name: /^Notifications/u })
      await hydrated(bell)
      await bell.click()
      await expect(page.getByRole('link', { name: 'View all notifications' })).toBeVisible()
      await page.keyboard.press('Escape')
      await page.goto('/notifications')
      await expect(page.getByRole('heading', { name: 'Notifications' }).first()).toBeVisible()
      await expect(page.getByText('Something went wrong')).toBeHidden()
    })

    test('opens every settings tab', async ({ page }) => {
      for (const { label, value } of SETTINGS_TABS) {
        await page.goto(`/settings?tab=${value}`)
        await expect(page.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByText('Something went wrong')).toBeHidden()
      }
    })

    test('exports the personal data without a password in it', async ({ page }) => {
      await page.goto('/settings?tab=data')
      const button = page.getByRole('button', { name: 'Download my data' })
      await hydrated(button)
      const download = page.waitForEvent('download')
      await button.click()
      const exported = JSON.parse(await readFile(await (await download).path(), 'utf8'))
      expect(exported.format).toBe('glore-account-export')
      expect(exported.account.email).toBe(seedEmail(role))
      expect(JSON.stringify(exported)).not.toMatch(/password/u)
    })
  })
}
