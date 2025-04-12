'use server'

import { type NestedKeyOf } from 'next-intl'

import { type AnyRecord } from '@repo/utils'

import type i18n from 'config/i18n.json'
import type messages from 'config/translations/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}

/**
 * Application locale keys.
 */
export type Locale = keyof typeof i18n.locales

/**
 * Application static messages.
 */
export type Messages = typeof messages

/**
 * Keys of the application's static messages.
 */
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

/**
 * Record with the available locale keys holding a string value.
 */
export type IntlRecord = Record<keyof typeof i18n.locales, string>

/**
 * Record Localized to the current locale.
 */
export type Localized<T extends AnyRecord> = {
  [K in keyof T]: T[K] extends (infer U extends AnyRecord)[]
    ? Localized<U>[]
    : T[K] extends object
      ? T[K] extends IntlRecord
        ? string
        : Localized<T[K]>
      : T[K]
}
