'use server'

import 'server-only'

import { type Locale } from 'next-intl'

import { LOCALES, clientMessages } from '@/lib/i18n'

export const getClientMessages = async (locale: Locale) => {
  if (!LOCALES.includes(locale)) throw new Error(`Unsupported locale: ${locale}`)
  const { default: messages } = await import(`~/messages/${locale}`)
  return clientMessages(messages)
}
