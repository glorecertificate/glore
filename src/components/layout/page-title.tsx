'use client'

import { useTranslations } from 'next-intl'

import { type MessageKey, type Namespace } from '@/lib/i18n'

export const PageTitle = <T extends Namespace>({ name, namespace }: { name: MessageKey<T>; namespace: T }) => {
  const t = useTranslations(namespace)
  const translate = t as unknown as (key: MessageKey<T>) => string

  return translate(name)
}
