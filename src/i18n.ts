import { getRequestConfig } from 'next-intl/server'
import 'server-only'

import { getLocaleCookie } from '@/actions/cookies'
import { i18n } from '@/lib/i18n'

export default getRequestConfig(async params => {
  const locale = params.locale ?? (await getLocaleCookie()) ?? i18n.defaultLocale
  const messages = (await import(`~/messages/${locale}`)).default
  return { locale, messages }
})
