'use server'

import { type NestedKeyOf } from 'next-intl'

import { type AnyObject, type Primitive } from '@repo/utils'

import type i18n from 'config/i18n.json'
import type messages from 'config/translations/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}

export type Locale = keyof typeof i18n.locales
export type Messages = typeof messages
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>
export type LocaleJson = Record<keyof typeof i18n.locales, string>

export type WithLocale<O extends AnyObject> = {
  [K in keyof O]: O[K] extends Primitive
    ? O[K]
    : O[K] extends AnyObject
      ? WithLocale<O[K]>
      : O[K] extends undefined
        ? Record<keyof typeof i18n.locales, string> | undefined
        : Record<keyof typeof i18n.locales, string>
}

export type LocalizedRecord = Record<keyof typeof i18n.locales, string>

export type Localized<O extends AnyObject> = {
  [K in keyof O]: O[K] extends LocalizedRecord
    ? string
    : O[K] extends Primitive
      ? O[K]
      : O[K] extends (infer T extends AnyObject)[]
        ? Localized<T>[]
        : Localized<O[K]>
}
