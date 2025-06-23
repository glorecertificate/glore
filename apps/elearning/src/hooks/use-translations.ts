'use client'

import {
  useTranslations as useNextIntlTranslations,
  type createTranslator,
  type NamespaceKeys,
  type NestedKeyOf,
} from 'next-intl'

import { type Messages } from '@/lib/i18n/types'

/**
 * Extends the hook from `next-intl` to support optional function arguments.
 */
export const useTranslations = useNextIntlTranslations as <
  K extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
>(
  namespace?: K,
) => ReturnType<typeof createTranslator> &
  ((
    key?: Parameters<ReturnType<typeof createTranslator>>[0],
    values?: Parameters<ReturnType<typeof createTranslator>>[1],
  ) => string)
