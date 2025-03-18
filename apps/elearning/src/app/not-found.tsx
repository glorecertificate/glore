'use client'

import { useTranslations } from 'next-intl'

import AppError from '@/components/app-error'
import { Asset } from '@/lib/storage'

export default () => {
  const t = useTranslations('Common')

  return (
    <AppError actionLabel={t('notFoundAction')} asset={Asset.NotFound} message={t('notFoundMessage')} title={t('notFound')} />
  )
}
