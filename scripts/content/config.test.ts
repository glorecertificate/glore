import { describe, expect, it } from 'vitest'

import { LOCALES as APP_LOCALES } from '@/lib/i18n'

import { ICON_NAMES, LOCALES } from './config.mts'

describe('content config', () => {
  it('uses the locales of the app', () => {
    expect(LOCALES).toEqual(APP_LOCALES)
  })

  it('knows the lucide icon names', () => {
    expect(ICON_NAMES.has('book-open')).toBe(true)
    expect(ICON_NAMES.has('not-an-icon')).toBe(false)
  })
})
