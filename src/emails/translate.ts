import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { type AppSettings } from '@/lib/app-settings'
import { TIME_ZONE } from '@/lib/i18n'
import defaultMessages from '~/messages/en.json'

type EmailValues = Record<string, Date | number | string>

export type EmailTranslator = ((key: string, values?: EmailValues) => string) & {
  has: (key: string) => boolean
}

export type EmailCategory = 'learning' | 'mandatory' | 'organization' | 'reminders'

export interface EmailBaseProps {
  category?: EmailCategory | null
  locale?: string
  messages?: AbstractIntlMessages
  settings?: AppSettings
}

export const emailTranslator = (
  namespace: string,
  { locale = 'en', messages = defaultMessages as AbstractIntlMessages }: EmailBaseProps
) =>
  createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as typeof defaultMessages,
    namespace: namespace as never,
    timeZone: TIME_ZONE,
  }) as unknown as EmailTranslator
