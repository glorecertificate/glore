'use client'

import {
  useTranslations as useNextIntlTranslations,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from 'next-intl'

import { type Translator } from '@/lib/i18n/types'

export const useTranslations = useNextIntlTranslations as <
  NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
>(
  namespace?: NestedKey,
) => Translator
