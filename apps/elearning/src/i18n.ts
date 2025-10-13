import { getRequestConfig } from 'next-intl/server'

import { DEFAULT_LOCALE } from '@/lib/intl'

export default getRequestConfig(async params => {
  const locale = params.locale ?? DEFAULT_LOCALE
  const messages = (await import(`../../../config/translations/${locale}.json`)).default
  return { locale, messages }
})
