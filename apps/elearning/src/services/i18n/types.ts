'use server'

import { type NestedKeyOf } from 'next-intl'

import { type AnyRecord } from '@repo/utils'

import type app from 'config/app.json'
import type messages from 'config/translations/en.json'

import { type formats } from './config'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

/**
 * Application locale keys.
 */
export type Locale = keyof typeof app.locales

/**
 * Record with the available locale keys holding a string value.
 */
export type IntlRecord = Record<Locale, string>

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

/**
 * Application static messages.
 */
export type Messages = typeof messages

/**
 * Keys of the application's static messages.
 */
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

/**
 * Available application formats.
 */
export type Formats = typeof formats
