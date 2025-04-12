import { cx } from 'class-variance-authority'
import type { ClassValue } from 'class-variance-authority/types'
import { twMerge } from 'tailwind-merge'

import { type AnyRecord, type Primitive } from '@repo/utils'

import { LOCALES, type IntlRecord, type Locale, type Localized } from '@/services/i18n'

/**
 * Merges and applies class name values conditionally.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Statically applies and verifies Tailwind class names.
 */
export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))

/**
 * Localizes a given object based on the provided locale.
 */
export const localize = <T extends AnyRecord>(data: T, locale: Locale): Localized<T> =>
  Array.isArray(data)
    ? (data.map(item => localize(item, locale)) as Localized<T>)
    : LOCALES.some(locale => !!data[locale])
      ? (data[locale] as Localized<T>)
      : Object.entries(data).reduce((obj, [key, value]) => {
          if (typeof value !== 'object' || value === null) return { ...obj, [key]: value as Primitive }
          if (Array.isArray(value)) return { ...obj, [key]: value.map(item => localize(item, locale)) }
          if (LOCALES.some(locale => !!(value as IntlRecord)[locale])) return { ...obj, [key]: (value as IntlRecord)?.[locale] }
          return { ...obj, [key]: localize(value, locale) }
        }, {} as Localized<T>)
