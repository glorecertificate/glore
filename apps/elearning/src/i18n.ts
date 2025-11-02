import { type Locale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/intl'

export default getRequestConfig(async params => {
  let locale: Locale
  if (params.locale && LOCALES.includes(params.locale)) locale = params.locale as Locale
  else {
    const { cookies } = await import('next/headers')
    const { get } = await cookies()
    const localeCookie = get('NEXT_LOCALE')?.value
    locale = localeCookie && LOCALES.includes(localeCookie as Locale) ? (localeCookie as Locale) : DEFAULT_LOCALE
  }
  const messages = (await import(`../config/translations/${locale}.json`)).default
  return { locale, messages }
})
