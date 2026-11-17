import { expect, test } from './fixtures'
import { authFile } from './helpers'
import { PERSONAS, PERSONAS_MISSING, hasPersonas, personaFile } from './personas'

const SCHEMES = ['light', 'dark'] as const

test.describe('ui kit catalog', () => {
  test.use({ storageState: authFile('admin') })

  for (const colorScheme of SCHEMES) {
    test(`has no axe violations in ${colorScheme}`, async ({ makeAxeBuilder, page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/dev/ui')
      await expect(page.locator('main section[id]').first()).toBeVisible()
      const { violations } = await makeAxeBuilder().include('main').analyze()
      expect(
        violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)
      ).toEqual([])
    })
  }
})

for (const persona of PERSONAS) {
  test.describe(`${persona} persona`, () => {
    test.use({ storageState: personaFile(persona) })

    test('has no axe violations on the dashboard', async ({ makeAxeBuilder, page }) => {
      test.skip(!(await hasPersonas()), PERSONAS_MISSING)
      await page.goto('/dashboard')
      await expect(page.locator('main')).toBeVisible()
      const { violations } = await makeAxeBuilder().include('main').analyze()
      expect(
        violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)
      ).toEqual([])
    })
  })
}
