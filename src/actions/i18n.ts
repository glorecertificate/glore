'use server'

import 'server-only'

import { type Locale } from 'next-intl'

import { LOCALES, clientMessages } from '@/lib/i18n'
import { loadMessages } from '@/lib/messages'

export const getClientMessages = async (locale: Locale) => {
  if (!LOCALES.includes(locale)) throw new Error(`Unsupported locale: ${locale}`)
  return clientMessages(await loadMessages(locale))
}
