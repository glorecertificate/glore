import 'server-only'

import { getRequestConfig } from 'next-intl/server'

import { getLocaleCookie } from '@/lib/cookie-store'
import { TIME_ZONE } from '@/lib/i18n'
import { loadMessages, resolveLocale } from '@/lib/messages'

const requestConfig = getRequestConfig(async params => {
  const locale = resolveLocale(params.locale ?? (await getLocaleCookie()))
  const messages = await loadMessages(locale)
  return { locale, messages, timeZone: TIME_ZONE }
})

export default requestConfig
