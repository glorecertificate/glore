import 'server-only'

import { getRequestConfig } from 'next-intl/server'

import { getLocaleCookie } from '@/actions/cookies'
import { DEFAULT_LOCALE } from '@/lib/i18n'

const requestConfig = getRequestConfig(async params => {
  const locale = params.locale ?? (await getLocaleCookie()) ?? DEFAULT_LOCALE
  const messages = (await import(`~/messages/${locale}`)).default
  return { locale, messages }
})

export default requestConfig
