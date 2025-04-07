'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/common/error-view'
import { AppButton } from '@/components/layout/app-button'
import { Path } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Modules')

  return (
    <ErrorView
      Actions={
        <AppButton color="primary" size="lg" to={Path.Modules} variant="outline">
          {t('backTo')}
        </AppButton>
      }
      message={t('notFoundMessage')}
      title={t('notFound')}
      type="not-found"
    />
  )
}
