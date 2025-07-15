import { type createTranslator, type NamespaceKeys, type NestedKeyOf } from 'next-intl'

import { type localeItems } from '@/lib/i18n/utils'
import { type locales } from 'config/app.json'
import type messages from 'config/translations/en.json'

import { type formats } from './config'

type Locale = keyof typeof locales
type Messages = typeof messages
type Formats = typeof formats

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

/**
 * Extends the `Translator` type to include the `flat` function.
 */
export type Translator<NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never> = ReturnType<
  typeof createTranslator<Messages, NestedKey>
> & {
  /**
   * Flat translation function that allows passing a string key directly.
   *
   * **Use with caution**: this bypasses type safety and should be used only when necessary.
   */
  flat: (key: string) => string
}

/**
 * Key of the application static messages.
 */
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

/**
 * Locale item used in the application.
 */
export type LocaleItem = (typeof localeItems)[number] & {
  active: boolean
}
