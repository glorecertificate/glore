import { type Browser, type BrowserContext, type Locator, type Page, expect } from '@playwright/test'

import { type Tenant, type TenantUser, tenantLogin } from './tenant'

export interface Actor {
  close: () => Promise<void>
  context: BrowserContext
  page: Page
}

export const actAs = async (browser: Browser, user: TenantUser, locale?: string): Promise<Actor> => {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } })
  if (locale) await context.addCookies([{ name: 'NEXT_LOCALE', url: 'https://glore.localhost', value: locale }])
  const page = await context.newPage()
  await tenantLogin(page, user)
  return { close: async () => await context.close(), context, page }
}

export const pickDay = async (page: Page, field: 'End date' | 'Start date', day: string) => {
  await page.getByRole('button', { name: field }).click()
  await page.locator(`td[data-day$="-${day}"]:not([data-outside=true]) button`).click()
  await expect(page.locator('[data-slot=calendar]')).toHaveCount(0)
}

export const fillExperience = async (page: Page) => {
  await pickDay(page, 'Start date', '03')
  await pickDay(page, 'End date', '07')
  await page.getByLabel('Total hours').fill('120')
  await page.getByLabel('Where did it take place?').fill('Milan, Italy')
  await page.getByRole('textbox', { name: 'Task 1' }).fill('Welcomed new volunteers')
}

export const rateOrganization = async (page: Page) => {
  for (const score of ['experience', 'support', 'certificationSupport']) {
    await page.locator(`label[for="rating-${score}-5"]`).click()
  }
  await page.getByRole('radio', { name: 'Yes' }).click()
}

export const pickSkills = async (page: Page, count = 3) => {
  const skills = page.getByRole('checkbox')
  for (let index = 0; index < count; index++) await skills.nth(index).click()
}

const navigatedToDetail = async (page: Page) => {
  try {
    await page.waitForURL(/\/certificates\/\d+$/u, { timeout: 6000 })
    return true
  } catch {
    return false
  }
}

export const submitFromLastStep = async (page: Page, label = 'Submit request') => {
  if (!(await navigatedToDetail(page))) {
    await page.getByRole('button', { name: label }).click()
    await expect(page).toHaveURL(/\/certificates\/\d+$/u)
  }
  await expect(page.getByText('Waiting for a reviewer to start.')).toBeVisible()
}

export const completeWizard = async (page: Page) => {
  await fillExperience(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await pickSkills(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await rateOrganization(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await submitFromLastStep(page)
}

export const certificateIdFromUrl = (page: Page) => Number(new URL(page.url()).pathname.split('/')[2])

export const tenantNames = (tenant: Tenant, key: string) => {
  const user = tenant.users[key]
  if (!user) throw new Error(`Missing tenant user ${key}`)
  return `${user.firstName} ${user.lastName}`
}

export const openDialog = async (trigger: Locator, dialog: Locator) => {
  await expect(async () => {
    await trigger.click()
    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass()
}
