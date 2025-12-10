import type { Locale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { i18n } from '@/lib/i18n'

export default getRequestConfig(async params => {
  const locale = params.locale ?? ((await params.requestLocale) as Locale) ?? i18n.defaultLocale
  const messages = (await import(`../config/translations/${locale}.json`)).default
  return { locale, messages }
})
