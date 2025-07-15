import { type createTranslator, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

import { type locales } from 'config/app.json'
import type messages from 'config/translations/en.json'

import { type formats } from './config'

export type Locale = keyof typeof locales
type Messages = typeof messages
type Formats = typeof formats

declare module 'use-intl' {
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
   * Flat translation function that allows passing any string as a key.
   *
   * **⚠️ Use with caution!** This method bypasses type safety and should be called only when using known dynamic keys.
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
export interface LocaleItem {
  label: string
  value: Locale
  icon: string
}
