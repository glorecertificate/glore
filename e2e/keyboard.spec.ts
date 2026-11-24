import { type Page, expect, test } from '@playwright/test'

import { SEED_PASSWORD, seedEmail } from '~/scripts/seed-data'

import { clearRateLimits } from './db'
import { type AuthRole, authFile, hydrated } from './helpers'

const STOPS = 35
const GUEST = { cookies: [], origins: [] }

const PAGES: { paths: string[]; role: AuthRole | null }[] = [
  { paths: ['/login', '/verify'], role: null },
  { paths: ['/dashboard', '/courses', '/certificates', '/settings'], role: 'volunteer' },
  { paths: ['/certificates'], role: 'tutor' },
  { paths: ['/organization'], role: 'owner' },
  { paths: ['/courses/skills'], role: 'editor' },
  { paths: ['/admin/users'], role: 'admin' },
]

const unmarkedFocus = async (page: Page) =>
  await page.evaluate(() => {
    const element = document.activeElement
    if (!(element instanceof HTMLElement) || element === document.body) return null
    if (element.tagName === 'NEXTJS-PORTAL') return null
    const marked = [null, '::before', '::after'].some(pseudo => {
      const style = getComputedStyle(element, pseudo)
      const outlined = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
      return outlined || style.boxShadow !== 'none'
    })
    if (marked) return null
    const name = element.getAttribute('aria-label') ?? element.textContent ?? ''
    return `${element.tagName.toLowerCase()}[${element.dataset.slot ?? ''}] ${name.trim().slice(0, 40)}`
  })

for (const { paths, role } of PAGES) {
  test.describe(`keyboard ${role ?? 'anonymous'}`, () => {
    test.use({ storageState: role ? authFile(role) : GUEST })

    for (const path of paths) {
      test(`marks the focused control on ${path}`, async ({ page }) => {
        test.setTimeout(90_000)
        await page.goto(path)
        await hydrated(page.locator('main').first())
        const unmarked = new Set<string>()
        for (let stop = 0; stop < STOPS; stop += 1) {
          await page.keyboard.press('Tab')
          const control = await unmarkedFocus(page)
          if (control) unmarked.add(control)
        }
        expect([...unmarked]).toEqual([])
      })
    }
  })
}

test.describe('keyboard journeys', () => {
  test.use({ storageState: GUEST })
  test.beforeAll(async () => {
    await clearRateLimits()
  })

  test('logs in without a pointer', async ({ page }) => {
    await page.goto('/login')
    const username = page.locator('input[name="username"]')
    await hydrated(username)
    await username.focus()
    await page.keyboard.type(seedEmail('volunteer'))
    await page.keyboard.press('Tab')
    const password = page.locator('input[name="password"]')
    for (let stop = 0; stop < 3; stop += 1) {
      if (await password.evaluate(input => input === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    await expect(password).toBeFocused()
    await page.keyboard.type(SEED_PASSWORD)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/dashboard/u)
  })

  test('looks up a certificate code without a pointer', async ({ page }) => {
    await page.goto('/verify')
    const code = page.locator('main input').first()
    await hydrated(code)
    await code.focus()
    await page.keyboard.type('E2E0-N0NE-X1ST')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Certificate not found' })).toBeVisible()
  })
})
