import AxeBuilder from '@axe-core/playwright'
import { test as base } from '@playwright/test'

import { AXE_TAGS } from '~/scripts/axe'

export { expect } from '@playwright/test'

export const FIXED_NOW = new Date('2026-06-15T09:30:00Z')

export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, provide) => {
    await provide(() => new AxeBuilder({ page }).withTags(AXE_TAGS).exclude('nextjs-portal'))
  },
})

export const visualTest = test.extend({
  page: async ({ page }, provide) => {
    await page.clock.setFixedTime(FIXED_NOW)
    await provide(page)
  },
})
