import { getRequestConfig } from 'next-intl/server'

import { type AnyRecord } from '@repo/utils'

import { getLocale } from '@/services/i18n'

export default getRequestConfig(async () => {
  const locale = await getLocale()

  const messages = (
    (await import(`config/translations/${locale}.json`)) as {
      default: AnyRecord
    }
  ).default

  return { locale, messages }
})
