import AxeBuilder from '@axe-core/playwright'
import { type Page, expect } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const BLOCKING = new Set(['critical', 'serious'])
const SETTLE_MS = 3000
const TOUCH_HIT = /\btouch-hit(?![\w-])/u

type Theme = 'dark' | 'light'

const settled = async (page: Page) => {
  try {
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS })
    return true
  } catch {
    return false
  }
}

const blockingIssues = async (page: Page) => {
  await expect(page.locator('[data-slot="loading-fallback"], [data-slot^="skeleton"]')).toHaveCount(0)
  await settled(page)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).exclude('nextjs-portal').analyze()
  return violations
    .map(violation => ({
      ...violation,
      nodes: violation.nodes.filter(node => violation.id !== 'target-size' || !TOUCH_HIT.test(node.html)),
    }))
    .filter(violation => BLOCKING.has(violation.impact ?? '') && violation.nodes.length > 0)
    .map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(' | ')}`)
}

const applyTheme = async (page: Page, theme: Theme) => {
  await page.evaluate(value => localStorage.setItem('theme', value), theme)
  await page.reload()
}

export const expectAccessible = async (page: Page, path: string) => {
  const issues: Record<Theme, string[]> = { dark: [], light: [] }
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(path)
    await applyTheme(page, theme)
    await expect(page.locator('main').first()).toBeVisible()
    issues[theme] = await blockingIssues(page)
  }
  expect(issues).toEqual({ dark: [], light: [] })
}
