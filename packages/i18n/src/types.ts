import type config from '@config/i18n'
import type messages from '@config/translations/en'
import { type NamespaceKeys, type NestedKeyOf, type createTranslator } from 'next-intl'

import { type i18nConfig } from './config'

export type Locale = keyof typeof config.locales
export type Messages = typeof messages
export type Formats = typeof i18nConfig.formats

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

/**
 * Extends the `next-intl` translator to include a `dynamic` function.
 */
export interface Translator<NestedKey extends Namespace = never>
  extends ReturnType<typeof createTranslator<Messages, NestedKey>> {
  /**
   * Dynamic translation function that allows passing any string as a key.
   *
   * **⚠️ Use with caution!** The method bypasses type safety and should be used only with known values.
   */
  dynamic: (key: string) => string
  raw(key: NamespaceKey<NestedKey>): string
}

/**
 * Namespace of the application static messages.
 */
export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>

/**
 * Key of a specific namespace of the application static messages.
 */
export type NamespaceKey<NestedKey extends Namespace> = Parameters<
  ReturnType<typeof createTranslator<Messages, NestedKey>>
>[0]

/**
 * Any key of the application static messages.
 */
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

/**
 * Locale item used in the application.
 */
export interface LocaleItem {
  label: string
  displayLabel: string
  value: Locale
  icon: string
}

/**
 * Record with translations for different locales.
 */
export type IntlRecord = Partial<Record<Locale, string>>
