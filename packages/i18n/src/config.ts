import { type DateTimeFormatOptions, type NumberFormatOptions } from 'use-intl/core'

import config from '@config/i18n'

import { type Locale, type LocaleItem } from './types'

export const TRANSLATIONS_PATH = '../../../config/translations'

/**
 * Internationalization configuration object.
 */
export const i18n = {
  /**
   * List of locales supported by the application.
   */
  locales: Object.keys(config.locales) as Locale[],
  /**
   * Items used to display locales across the application.
   */
  localeItems: Object.entries(config.locales).map(
    ([value, { flag, name }]) =>
      ({
        displayLabel: name,
        icon: flag,
        label: name,
        value,
      }) as const as LocaleItem,
  ),
  /**
   * Default application locale.
   */
  defaultLocale: config.defaultLocale as Locale,
  /**
   * Locales that should be displayed in title case, useful for languages with specific capitalization rules.
   */
  titleCaseLocales: Object.freeze(config.titleCaseLocales) as Locale[],
  /**
   * Formats used for localization.
   */
  formats: {
    dateTime: {
      short: {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    },
    list: {
      enumeration: {
        style: 'long',
        type: 'conjunction',
      },
    },
    number: {
      precise: {
        maximumFractionDigits: 5,
      },
    },
  } satisfies {
    dateTime: Record<string, DateTimeFormatOptions>
    list: Record<string, Intl.ListFormatOptions>
    number: Record<string, NumberFormatOptions>
  },
}
