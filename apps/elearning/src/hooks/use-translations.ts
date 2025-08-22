'use client'

import {
  useTranslations as useNextIntlTranslations,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from 'use-intl'

import { type Translator } from '@/lib/i18n/types'

/**
 * Extends the `use-intl` hook to allow dynamic translations.
 */
export const useTranslations = <NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never>(
  namespace?: NestedKey,
) => {
  const translations = useNextIntlTranslations(namespace)
  // @ts-expect-error - Allow adding the dynamic function
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
