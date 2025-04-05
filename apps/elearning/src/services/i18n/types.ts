'use server'

import type { Locale, Messages, NestedKeyOf } from 'next-intl'

import type i18n from 'config/i18n.json'
import type messages from 'config/translations/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: keyof typeof i18n.locales
    Messages: typeof messages
  }
}

type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>
type MessageKeyOf<T extends keyof Messages> = keyof Messages[T]

export type { Locale, MessageKey, MessageKeyOf, Messages }
