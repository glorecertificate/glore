'use client'

import { useTranslations } from 'next-intl'

import AppError from '@/components/app-error'
import { Asset } from '@/lib/storage'

export default () => {
  const t = useTranslations('Common')

  return <AppError asset={Asset.NotFound} assetWidth={400} message={t('notFoundMessage')} title={t('notFound')} />
}
