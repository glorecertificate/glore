import { type Locator, type Page, expect } from '@playwright/test'

import { hydrated } from './helpers'

const MAX_STOPS = 150
const KEY_HOLD = 80

const holdsFocus = async (locator: Locator) =>
  await locator.evaluate(element => element === document.activeElement || element.contains(document.activeElement))

export const tabTo = async (page: Page, locator: Locator) => {
  await expect(locator).toBeVisible()
  await hydrated(locator)
  for (let stop = 0; stop < MAX_STOPS; stop += 1) {
    if (await holdsFocus(locator)) return
    await page.keyboard.press('Tab')
  }
  expect(await holdsFocus(locator), `${locator} is reachable with Tab`).toBe(true)
}

export const pressOn = async (page: Page, locator: Locator, key: 'Enter' | 'Space' = 'Enter') => {
  await tabTo(page, locator)
  await page.keyboard.press(key)
}

export const typeIn = async (page: Page, locator: Locator, text: string) => {
  await tabTo(page, locator)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(text)
  await expect(locator).toHaveValue(text)
}

export const chooseRadio = async (page: Page, radio: Locator) => {
  const group = radio.locator('xpath=ancestor::*[@role="radiogroup"]')
  await expect(group).toHaveAccessibleName(/\S/u)
  await tabTo(page, group)
  await page.keyboard.press('Space', { delay: KEY_HOLD })
  for (let step = 0; step < 10; step += 1) {
    if (await radio.isChecked()) return
    await page.keyboard.press('ArrowRight', { delay: KEY_HOLD })
  }
  await expect(radio).toBeChecked()
}
