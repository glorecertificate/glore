import { expect, visualTest as test } from './fixtures'
import { authFile } from './helpers'

const SCHEMES = ['light', 'dark'] as const

test.use({ storageState: authFile('admin') })

for (const colorScheme of SCHEMES) {
  test(`renders each catalog section in ${colorScheme}`, async ({ page }, testInfo) => {
    test.skip(colorScheme === 'dark' && testInfo.project.name === 'visual-mobile', 'Desktop covers the dark tokens')
    await page.emulateMedia({ colorScheme })
    await page.goto('/dev/ui')
    const sections = page.locator('main section[id]')
    await expect(sections.first()).toBeVisible()
    await page.evaluate(async () => await document.fonts.ready)
    const ids = await sections.evaluateAll(elements => elements.map(element => element.id))
    expect(ids.length).toBeGreaterThan(10)
    for (const id of ids) {
      await expect.soft(page.locator(`section#${id}`)).toHaveScreenshot(`${colorScheme}-${id}.png`)
    }
  })
}
