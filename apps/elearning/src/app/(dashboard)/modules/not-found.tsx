'use client'

import { useTranslations } from 'next-intl'

import { ErrorView } from '@/components/common/error-view'
import { DashboardButton } from '@/components/layout/dashboard-button'
import { Route } from '@/lib/navigation'

export default () => {
  const t = useTranslations('Modules')

  return (
    <ErrorView
      Actions={
        <DashboardButton color="primary" size="lg" to={Route.Modules} variant="outline">
          {t('backTo')}
        </DashboardButton>
      }
      message={t('notFoundMessage')}
      title={t('notFound')}
      type="not-found"
    />
  )
}
