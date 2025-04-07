'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/common/error-view'
import { AppButton } from '@/components/layout/app-button'
import { Path } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Certificates')

  return (
    <ErrorView
      Actions={
        <AppButton color="secondary" size="lg" to={Path.Certificates} variant="outline">
          {t('backTo')}
        </AppButton>
      }
      message={t('notFoundMessage')}
      title={t('notFound')}
      type="not-found"
    />
  )
}
