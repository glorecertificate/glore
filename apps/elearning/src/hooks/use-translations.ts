'use client'

import { useTranslations as useIntlTranslations } from 'next-intl'

import { type Namespace, type Translator } from '@glore/i18n'

/**
 * Extends the `next-intl` hook to allow dynamic translations.
 */
export const useTranslations = <NestedKey extends Namespace = never>(namespace?: NestedKey) => {
  const translations = useIntlTranslations(namespace)
  // @ts-expect-error
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
