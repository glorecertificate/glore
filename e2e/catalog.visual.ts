import { expect, visualTest as test } from './fixtures'
import { authFile } from './helpers'

const SCHEMES = ['light', 'dark'] as const

test.use({ storageState: authFile('admin') })

for (const colorScheme of SCHEMES) {
  test(`renders each catalog section in ${colorScheme}`, async ({ browserName, page }, testInfo) => {
    test.skip(colorScheme === 'dark' && testInfo.project.name === 'visual-mobile', 'Desktop covers the dark tokens')
    await page.emulateMedia({ colorScheme })
    await page.goto('/dev/ui')
    const sections = page.locator('main section[id]')
    await expect(sections.first()).toBeVisible()
    await page.evaluate(async () => await document.fonts.ready)
    const ids = await sections.evaluateAll(elements => elements.map(element => element.id))
    expect(ids.length).toBeGreaterThan(10)
    const viewport = page.viewportSize()?.height ?? 0
    for (const id of ids) {
      const section = page.locator(`section#${id}`)
      if (browserName === 'chromium') {
        const height = (await section.boundingBox())?.height ?? 0
        expect.soft(height, `section ${id} fits in the viewport`).toBeLessThanOrEqual(viewport)
      }
      await expect.soft(section).toHaveScreenshot(`${colorScheme}-${id}.png`)
    }
  })
}
