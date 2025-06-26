import { getRequestConfig } from 'next-intl/server'

import { type AnyRecord } from '@repo/utils'

import { getLocale } from '@/lib/i18n/server'

export default getRequestConfig(async () => {
  const locale = await getLocale()

  const messages = (
    (await import(`config/translations/${locale}.json`)) as {
      default: AnyRecord
    }
  ).default

  return { locale, messages }
})
