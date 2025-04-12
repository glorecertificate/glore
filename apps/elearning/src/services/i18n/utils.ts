import { type AnyRecord, type Primitive } from '@repo/utils'

import i18n from 'config/i18n.json'

import type { IntlRecord, Locale, Localized } from './types'

export const LOCALES = Object.keys(i18n.locales) as Locale[]

export const localize = <T extends AnyRecord>(data: T, locale: Locale): Localized<T> =>
  Object.entries(data).reduce((obj, [key, value]) => {
    if (typeof value === 'object' && value !== null && LOCALES.every(locale => locale in value)) {
      return { ...obj, [key]: (value as IntlRecord)[locale] }
    }
    if (typeof value === 'object' && value !== null) {
      return { ...obj, [key]: localize(value, locale) }
    }
    return { ...obj, [key]: value as Primitive }
  }, {} as Localized<T>)
