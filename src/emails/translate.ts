import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import defaultMessages from '~/messages/en.json'

type EmailValues = Record<string, Date | number | string>

export type EmailTranslator = ((key: string, values?: EmailValues) => string) & {
  has: (key: string) => boolean
}

export interface EmailBaseProps {
  locale?: string
  messages?: AbstractIntlMessages
}

export const emailTranslator = (
  namespace: string,
  { locale = 'en', messages = defaultMessages as AbstractIntlMessages }: EmailBaseProps
) =>
  createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as typeof defaultMessages,
    namespace: namespace as never,
    timeZone: 'Europe/Rome',
  }) as unknown as EmailTranslator
