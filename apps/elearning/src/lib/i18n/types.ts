import { type createTranslator, type Locale, type Messages, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

/**
 * Extends the `next-intl` translator to include a `dynamic` function.
 */
export interface Translator<NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never>
  extends ReturnType<typeof createTranslator<Messages, NestedKey>> {
  /**
   * Dynamic translation function that allows passing any string as a key.
   *
   * **⚠️ Use with caution!** The method bypasses type safety and should be only used with known values.
   */
  dynamic: (key: string) => string
  raw(key: Parameters<ReturnType<typeof createTranslator<Messages, NestedKey>>['raw']>[0]): string
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
  displayLabel: string
  value: Locale
  icon: string
}

/**
 * Record with translations for different locales.
 */
export type IntlRecord = Partial<Record<Locale, string>>
