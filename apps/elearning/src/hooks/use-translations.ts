'use client'

import {
  useTranslations as useNextIntlTranslations,
  type MessageKeys,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from 'next-intl'

import { type Translator } from '@/lib/i18n/types'

/**
 * Extends the `next-intl` hook to include a flat translation function.
 */
export const useTranslations = <NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never>(
  namespace?: NestedKey,
) => {
  const translations = useNextIntlTranslations(namespace) as Translator<NestedKey>
  // @ts-expect-error - Allow passing no arguments to the translations.
  translations.flat = (key: string) => translations(key as MessageKeys<Messages, NestedKeyOf<Messages>>)
  return translations
}
