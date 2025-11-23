import { type Locale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { DEFAULT_LOCALE } from '@/lib/intl'

export default getRequestConfig(async params => {
  const locale = params.locale ?? ((await params.requestLocale) as Locale) ?? DEFAULT_LOCALE
  const messages = (await import(`../config/translations/${locale}.json`)).default
  return { locale, messages }
})
