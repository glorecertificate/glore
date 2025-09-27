import { createTranslator } from 'use-intl/core'

import { i18n, TRANSLATIONS_PATH } from './config'
import { type Locale, type Messages, type Namespace, type Translator } from './types'

export const getMessages = async (locale: Locale) => {
  const { default: messages } = (await import(`${TRANSLATIONS_PATH}/${locale}.json`)) as {
    default: Messages
  }
  return messages
}

export const getTranslations = async <NestedKey extends Namespace = never>(
  namespace?: NestedKey,
  options?: {
    locale?: Locale
    messages?: Messages
  },
) => {
  const { locale = i18n.defaultLocale, messages = await getMessages(locale) } = options ?? {}
  const translations = createTranslator<Messages, NestedKey>({ locale, messages, namespace })
  // @ts-expect-error - Allow dynamic translations
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
