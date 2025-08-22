import { type DateTimeFormatOptions, type Formats, type Locale, type NumberFormatOptions } from 'use-intl'

import { type LocaleItem } from '@/lib/i18n/types'
import config from 'config/app.json'
import type messages from 'config/translations/en.json'

declare module 'use-intl' {
  interface AppConfig {
    Locale: keyof typeof config.locales
    Messages: typeof messages
    Formats: typeof FORMATS
  }
}

const LOCALES = Object.freeze(Object.keys(config.locales) as Locale[])

const DEFAULT_LOCALE = config.defaultLocale as Locale

const LOCALE_ITEMS = Object.freeze(
  Object.entries(config.locales).map(
    ([value, { flag, name }]) =>
      Object.freeze({
        label: name,
        displayLabel: name,
        value: value as Locale,
        icon: flag,
      }) as LocaleItem,
  ),
)

const TITLE_CASE_LOCALES = Object.freeze(config.titleCaseLocales as Locale[])

const FORMATS = Object.freeze({
  dateTime: Object.freeze({
    short: Object.freeze({
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }),
  list: Object.freeze({
    enumeration: Object.freeze({
      style: 'long',
      type: 'conjunction',
    }),
  }),
  number: Object.freeze({
    precise: Object.freeze({
      maximumFractionDigits: 5,
    }),
  }),
}) satisfies {
  dateTime: Record<string, DateTimeFormatOptions>
  list: Record<string, Intl.ListFormatOptions>
  number: Record<string, NumberFormatOptions>
}

/**
 * Internationalization configuration object.
 */
export const i18n = {
  /**
   * List of locales supported by the application.
   */
  locales: LOCALES,
  /**
   * Default locale of the application.
   */
  defaultLocale: DEFAULT_LOCALE,
  /**
   * Locales that should be displayed in title case, useful for languages with specific capitalization rules.
   */
  titleCaseLocales: TITLE_CASE_LOCALES,
  /**
   * Items used to display locales across the application.
   */
  localeItems: LOCALE_ITEMS,
  /**
   * Formats used for localization.
   */
  formats: FORMATS as Formats,
}
