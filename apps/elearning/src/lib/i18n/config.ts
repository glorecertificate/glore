import { type Formats } from 'use-intl'

import config from 'config/app.json'

import { type Locale, type LocaleItem } from './types'

/**
 * List of locales supported by the application.
 */
export const LOCALES = Object.keys(config.locales) as Locale[]

/**
 * Items used to display locales across the application.
 */
export const LOCALE_ITEMS = Object.entries(config.locales).map(
  ([value, { flag, name }]) =>
    ({
      label: name,
      value,
      icon: flag,
    }) as LocaleItem,
)

/**
 * Locales that should be displayed in title case.
 * This is useful for languages that have specific capitalization rules.
 */
export const TITLE_CASE_LOCALES = config.titleCaseLocales as Locale[]

/**
 * Formats used for localization.
 */
export const FORMATS: Formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
}
