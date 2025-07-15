'use client'

import { useTranslations as useIntlTranslations, type Messages, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

import { type Translator } from '@/lib/i18n/types'

/**
 * Extends the `use-intl` hook to include a flat translation function.
 */
export const useTranslations = <NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never>(
  namespace?: NestedKey,
) => {
  const translations = useIntlTranslations(namespace)
  // @ts-expect-error - Allow flat function to be added to the translations object
  translations.flat = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
